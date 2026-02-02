// api/create.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { tracking_id, subject } = req.body;

  const { error } = await supabase
    .from('email_tracking')
    .insert([{ tracking_id, subject }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ success: true });
}
