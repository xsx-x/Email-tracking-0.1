import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// פונקציית עזר לאבטחה: בדיקה שה-ID הוא באמת UUID ולא קוד זדוני
function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export default async function handler(req, res) {
  // הגדרת כותרות למניעת Cache - אנחנו רוצים את הסטטוס העדכני ביותר
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { id } = req.query;

  // ולידציה בסיסית
  if (!id || !isValidUUID(id)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid ID format" 
    });
  }

  try {
    // שליפת הנתונים הרלוונטיים בלבד
    const { data, error } = await supabase
      .from('email_tracking')
      .select('open_count, last_opened_at')
      .eq('tracking_id', id)
      .single();

    if (error) {
      // אם לא נמצא, מחזירים 0 (עדיין לא נפתח / לא קיים)
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        last_opened: null 
      });
    }

    // החזרת התשובה לתוסף
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
