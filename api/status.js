import { createClient } from '@supabase/supabase-js';

// יצירת חיבור מאובטח למסד הנתונים
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// פונקציית עזר לבדיקת תקינות של UUID (מונע הזרקות זדוניות)
function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export default async function handler(req, res) {
  // הגדרת כותרות כדי למנוע שמירת מידע ישן בזיכרון הדפדפן
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { id } = req.query;

  // 1. אבטחה: בדיקה שנשלח מזהה ושמבנהו תקין
  if (!id || !isValidUUID(id)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid or missing Tracking ID" 
    });
  }

  try {
    // 2. שליפה יעילה ממסד הנתונים
    const { data, error } = await supabase
      .from('email_tracking')
      .select('open_count, last_opened_at')
      .eq('tracking_id', id)
      .single();

    if (error) {
      // אם לא נמצאה רשומה, זה בסדר - זה אומר שהמייל נשלח אבל השרת עוד לא רשם אותו
      // או שהוא לא קיים. נחזיר 0.
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        last_opened: null 
      });
    }

    // 3. החזרת התשובה
    return res.status(200).json({ 
      success: true, 
      count: data.open_count,
      last_opened: data.last_opened_at
    });

  } catch (err) {
    console.error("Status API Error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
