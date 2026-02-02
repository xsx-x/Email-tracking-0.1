// api/track.js
import { createClient } from '@supabase/supabase-js';

// הגדרת משתני סביבה ב-Vercel בהמשך
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// פיקסל שקוף 1x1 בפורמט GIF
const transparentPixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export default async function handler(req, res) {
  const { id } = req.query;

  // אנחנו מחזירים את התמונה מיד כדי לא להאט את המייל
  res.setHeader('Content-Type', 'image/gif');
  // קריטי: מניעת שמירה בזיכרון (Cache) כדי שכל פתיחה תירשם מחדש
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.status(200).send(transparentPixel);

  if (!id) return;

  try {
    // עדכון מסד הנתונים ברקע
    // אנו שולפים את הרשומה הקיימת כדי לעדכן
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // בשאילתה אחת: מעלים את המונה ומוסיפים לוג להיסטוריה
    // הערה: בקוד פרודקשן כבד עדיף להשתמש ב-RPC או טבלה נפרדת ל-Events
    // כאן לפשטות אנו מעדכנים JSON
    
    // קודם נביא את המידע הנוכחי (אופטימיזציה נדרשת בסקייל גבוה)
    const { data: current } = await supabase
        .from('email_tracking')
        .select('open_count, opens_details')
        .eq('tracking_id', id)
        .single();

    if (current) {
        const newEvent = {
            at: new Date().toISOString(),
            ua: userAgent,
            ip: ip // שים לב: זה יהיה ה-IP של גוגל פרוקסי ברוב המקרים
        };
        
        const newDetails = current.opens_details || [];
        newDetails.push(newEvent);

        await supabase
          .from('email_tracking')
          .update({ 
            open_count: current.open_count + 1,
            last_opened_at: new Date().toISOString(),
            opens_details: newDetails
          })
          .eq('tracking_id', id);
    } else {
        // מקרה קצה: המזהה לא קיים (אולי נוצר ידנית או בטעות)
        // אפשר ליצור אותו כאן או להתעלם
    }

  } catch (error) {
    console.error('Error tracking email:', error);
  }
}
