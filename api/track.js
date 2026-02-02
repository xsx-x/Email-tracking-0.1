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

  // כותרות למניעת Cache (חובה!)
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // שולחים את התמונה מיד כדי שהדפדפן לא יחכה
  res.status(200).send(transparentPixel);

  if (!id) return;

  try {
    // 1. ננסה לשלוף את הרשומה
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
      // --- אפשרות א: המזהה קיים -> נעדכן אותו ---
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
      // --- אפשרות ב: המזהה חדש (התיקון החשוב!) -> ניצור אותו ---
      // במקרה זה הנושא יהיה "Unknown Subject" כי הפיקסל לא יודע מה הנושא
      // אבל לפחות המעקב יעבוד!
      await supabase
        .from('email_tracking')
        .insert([
          {
            tracking_id: id,
            subject: '(Auto Created via Open)', 
            open_count: 1, // מתחילים מ-1
            last_opened_at: new Date().toISOString(),
            opens_details: [newEvent]
          }
        ]);
    }
  } catch (error) {
    console.error('Track error:', error);
  }
}
