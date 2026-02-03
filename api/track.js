import { createClient } from '@supabase/supabase-js';

// יצירת קשר עם מסד הנתונים
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// הפיקסל השקוף (GIF בגודל 1x1)
const transparentPixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export default async function handler(req, res) {
  const { id } = req.query;

  // --- שלב 1: הגדרת כותרות (Headers) למניעת שמירה בזיכרון ---
  // זה קריטי! אומר לג'ימייל ולדפדפן: "אל תשמרו את התמונה הזו, תבקשו אותה מחדש בכל פעם"
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    if (id) {
      // --- שלב 2: לוגיקה מול מסד הנתונים ---
      
      // נסיון שליפת רשומה קיימת
      const { data: current, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('tracking_id', id)
        .single();

      // הכנת פרטי האירוע (תאריך, דפדפן, IP)
      const newEvent = {
        at: new Date().toISOString(),
        ua: req.headers['user-agent'] || 'unknown',
        ip: req.headers['x-forwarded-for'] || 'unknown'
      };

      if (current) {
        // תרחיש א': הרשומה קיימת -> נעדכן את המספר
        const newDetails = current.opens_details || [];
        newDetails.push(newEvent);

        await supabase
          .from('email_tracking')
          .update({
            open_count: (current.open_count || 0) + 1,
            last_opened_at: new Date().toISOString(),
            opens_details: newDetails
          })
          .eq('tracking_id', id);

      } else {
        // תרחיש ב': הרשומה לא קיימת -> ניצור אותה מאפס
        // (זה קורה כי התוסף יצר ID חדש ושם במייל, ועכשיו זו הפעם הראשונה שהשרת רואה אותו)
        await supabase
          .from('email_tracking')
          .insert([
            {
              tracking_id: id,
              subject: '(Auto Created via Open)', // אין לנו את הנושא כרגע, אבל המעקב יעבוד
              open_count: 1,
              last_opened_at: new Date().toISOString(),
              opens_details: [newEvent]
            }
          ]);
      }
    }
  } catch (error) {
    // אם יש שגיאה בשרת, נרשום אותה בלוגים של Vercel
    console.error('Track Error:', error);
  } finally {
    // --- שלב 3: תמיד להחזיר תמונה ---
    // השימוש ב-finally מבטיח שהתמונה תישלח גם אם הייתה שגיאה במסד הנתונים
    // זה מונע מצב של "תמונה שבורה" במייל
    res.status(200).send(transparentPixel);
  }
}
