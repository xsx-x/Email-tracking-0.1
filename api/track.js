import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // 1. קודם כל ולפני הכל: מחזירים תמונה שקופה לדפדפן
  // זה חייב לקרות מהר כדי שהמייל ייטען חלק
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  
  res.setHeader('Content-Type', 'image/gif');
  // פקודות למניעת שמירה בזיכרון (Cache) - קריטי!
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.status(200).send(pixel);

  // 2. רק אם יש מזהה, ממשיכים לעדכן את הטבלה ברקע
  if (id) {
    try {
      // שלב א: משיכת הנתונים הקיימים
      const { data: current, error: findError } = await supabase
        .from('email_tracking')
        .select('open_count')
        .eq('tracking_id', id)
        .single();

      if (!findError && current) {
        // שלב ב: עדכון המספר + זמן הפתיחה
        await supabase
          .from('email_tracking')
          .update({ 
            open_count: (current.open_count || 0) + 1,
            last_opened_at: new Date().toISOString()
          })
          .eq('tracking_id', id);
      }
    } catch (err) {
      // אנחנו מתעלמים משגיאות כאן כדי לא להפיל את השרת, 
      // כי התמונה כבר נשלחה למשתמש.
      console.error("Track Error:", err);
    }
  }
}
