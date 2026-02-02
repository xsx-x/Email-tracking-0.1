// api/status.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // אפשר להוסיף כאן בדיקת CORS כדי שרק התוסף שלך יוכל לקרוא
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  
  const { ids } = req.query; // נקבל רשימה של IDs מופרדים בפסיק
  if (!ids) return res.json({});

  const idList = ids.split(',');

  const { data, error } = await supabase
    .from('email_tracking')
    .select('tracking_id, open_count, last_opened_at')
    .in('tracking_id', idList);

  if (error) return res.status(500).json({ error: error.message });

  // המרת המערך לאובייקט לנוחות הצד לקוח
  const result = {};
  data.forEach(row => {
      result[row.tracking_id] = row;
  });

  res.status(200).json(result);
}
