import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // שינוי ל-PNG: זהו פיקסל שקוף בפורמט PNG (יותר אמין מג'ימייל)
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );

  // כותרות חזקות למניעת שמירה בזיכרון
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Expires', '0');
  res.setHeader('Pragma', 'no-cache');

  if (!id) {
      return res.status(200).send(pixel);
  }

  try {
    // רישום הפתיחה במסד הנתונים
    const { data: current, error: findError } = await supabase
      .from('email_tracking')
      .select('open_count')
      .eq('tracking_id', id)
      .single();

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
    console.error("Error:", err);
  }

  return res.status(200).send(pixel);
}
