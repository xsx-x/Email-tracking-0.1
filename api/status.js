// api/status.js //

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { id } = req.query;

  if (!id || !isValidUUID(id)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid ID format" 
    });
  }

  try {
    // הוספנו את 'opens_details' לשליפה
    const { data, error } = await supabase
      .from('email_tracking')
      .select('open_count, last_opened_at, opens_details')
      .eq('tracking_id', id)
      .single();

    if (error) {
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        last_opened: null,
        history: [] 
      });
    }

    return res.status(200).json({ 
      success: true, 
      count: data.open_count,
      last_opened: data.last_opened_at,
      history: data.opens_details || [] // החזרת המערך המלא של ההיסטוריה
    });

  } catch (err) {
    console.error("Status API Error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
