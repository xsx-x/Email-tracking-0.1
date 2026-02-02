import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // 1. מחזירים מיד תמונה שקופה לדפדפן (כדי לא לעכב)
  // משתמשים בקידוד base64 של גיף שקוף 1x1
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  
  res.setHeader('Content-Type', 'image/gif');
  // מניעת שמירה בזיכרון (Cache) - חובה!
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.status(200).send(pixel);

  if (!id) return;

  // 2. עדכון המסד נתונים ברקע
  try {
    // אנחנו שולפים את המידע הנוכחי
    const { data: currentRecord, error: fetchError } = await supabase
      .from('email_tracking')
      .select('open_count, opens_details')
      .eq('tracking_id', id)
      .single();

    if (fetchError || !currentRecord) {
      console.error("Error fetching record:", fetchError);
      return;
    }

    // מכינים את רשומת האירוע החדשה
    const newEvent = {
      at: new Date().toISOString(),
      ua: req.headers['user-agent'] || 'unknown',
      ip: req.headers['x-forwarded-for'] || 'unknown'
    };

    // מוסיפים לרשימה הקיימת (או יוצרים חדשה אם ריקה)
    const currentDetails = Array.isArray(currentRecord.opens_details) 
        ? currentRecord.opens_details 
        : [];
        
    currentDetails.push(newEvent);

    // מעדכנים את הרשומה
    const { error: updateError } = await supabase
      .from('email_tracking')
      .update({
        open_count: (currentRecord.open_count || 0) + 1,
        last_opened_at: new Date().toISOString(),
        opens_details: currentDetails
      })
      .eq('tracking_id', id);

    if (updateError) {
      console.error("Error updating record:", updateError);
    } else {
      console.log("Success! Updated tracking for:", id);
    }

  } catch (error) {
    console.error("Critical error in track.js:", error);
  }
}
