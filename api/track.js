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

  // הגדרות למניעת Cache
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (id) {
      // 1. קודם כל מבצעים את העבודה מול מסד הנתונים
      const { data: current, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('tracking_id', id)
        .single();

      const newEvent = {
        at: new Date().toISOString(),
        ua: req.headers['user-agent'] || 'unknown',
        ip: req.headers['x-forwarded-for'] || 'unknown'
      };

      if (current) {
        // עדכון קיים
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
        // יצירה חדשה (למקרה שהתוסף יצר ID חדש)
        await supabase
          .from('email_tracking')
          .insert([
            {
              tracking_id: id,
              subject: '(Auto Created via Open)', 
              open_count: 1,
              last_opened_at: new Date().toISOString(),
              opens_details: [newEvent]
            }
          ]);
      }
    }
  } catch (error) {
    console.error('Track error:', error);
    // גם אם יש שגיאה - לא נורא, העיקר שהתמונה תישלח בסוף
  } finally {
    // 2. רק בסוף שולחים את התמונה!
    // זה מבטיח שהתהליך לא ייהרג באמצע
    res.status(200).send(transparentPixel);
  }
}
