import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // --- אישורי CORS ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // -------------------

  const { ids } = req.query;
  if (!ids) return res.json({});

  const idList = ids.split(',');

  const { data, error } = await supabase
    .from('email_tracking')
    .select('tracking_id, open_count, last_opened_at')
    .in('tracking_id', idList);

  if (error) return res.status(500).json({ error: error.message });

  const result = {};
  data.forEach(row => {
      result[row.tracking_id] = row;
  });

  res.status(200).json(result);
}
