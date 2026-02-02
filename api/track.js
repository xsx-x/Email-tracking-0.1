import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // הכנת הפיקסל מראש
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  // הגדרת כותרות (Headers) כדי שהתמונה לא תיכנס לזיכרון
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  // אם אין מזהה, סתם שולחים תמונה והולכים
  if (!id) {
      return res.status(200).send(pixel);
  }

  try {
    // --- שלב העדכון (קודם כל מבצעים את העבודה!) ---
    
    // 1. משיכת הנתונים הקיימים
    const { data: current, error: findError } = await supabase
      .from('email_tracking')
      .select('open_count')
      .eq('tracking_id', id)
      .single();

    // 2. אם מצאנו רשומה, מעדכנים אותה
    if (!findError && current) {
      await supabase
        .from('email_tracking')
        .update({ 
          open_count: (current.open_count || 0) + 1,
          last_opened_at: new Date().toISOString()
        })
        .eq('tracking_id', id);
    }
    
  } catch (err) {
    // גם אם הייתה שגיאה במסד הנתונים, אנחנו מדפיסים אותה ללוג
    // אבל לא עוצרים - כדי שהמשתמש בכל זאת יקבל תמונה ולא שגיאה
    console.error("Track Error:", err);
  }

  // --- רק בסוף שולחים את התמונה ---
  // ככה אנחנו בטוחים ש-Vercel לא סגר לנו את הברז באמצע
  return res.status(200).send(pixel);
}
