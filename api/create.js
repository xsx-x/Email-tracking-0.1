import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// פיקסל שקוף 1x1
const transparentPixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export default async function handler(req, res) {
  const { id } = req.query;

  // הגדרת כותרות (Headers) חשובות
  res.setHeader('Content-Type', 'image/gif');
  // פקודות למניעת שמירה בזיכרון (Cache) - קריטי לג'ימייל!
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // 1. קודם כל ננסה לעדכן את מסד הנתונים
    if (id) {
      // שליפת הרשומה הנוכחית
      const { data: current, error: fetchError } = await supabase
        .from('email_tracking')
        .select('open_count, opens_details')
        .eq('tracking_id', id)
        .single();

      if (!fetchError && current) {
        // הוספת מידע חדש
        const newEvent = {
          at: new Date().toISOString(),
          ua: req.headers['user-agent'] || 'unknown',
          ip: req.headers['x-forwarded-for'] || 'unknown'
        };

        const newDetails = current.opens_details || [];
        newDetails.push(newEvent);

        // שמירה חזרה בטבלה
        await supabase
          .from('email_tracking')
          .update({
            open_count: (current.open_count || 0) + 1,
            last_opened_at: new Date().toISOString(),
            opens_details: newDetails
          })
          .eq('tracking_id', id);
      }
    }
  } catch (error) {
    // אם הייתה שגיאה במסד הנתונים - נדפיס אותה ללוג, אבל לא נשבור את התמונה
    console.error('Track error:', error);
  } finally {
    // 2. בסוף, תמיד נחזיר את התמונה, גם אם העדכון הצליח וגם אם נכשל
    res.status(200).send(transparentPixel);
  }
}
