import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // הכנת הפיקסל (תמונה שקופה)
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  // הגדרת כותרות (Headers)
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  // אם אין מזהה, שלח תמונה וסיים
  if (!id) {
      return res.status(200).send(pixel);
  }

  try {
    // --- ביצוע העדכון בטבלה (בדיוק כמו בגרסת הטקסט שעבדה) ---
    
    // 1. קריאה
    const { data: current, error: findError } = await supabase
      .from('email_tracking')
      .select('open_count')
      .eq('tracking_id', id)
      .single();

    // 2. כתיבה
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

  // --- רק בסוף: שליחת התמונה לדפדפן ---
  return res.status(200).send(pixel);
}
