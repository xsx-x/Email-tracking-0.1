import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // אישורי כניסה (CORS) - חובה!
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // אם הדפדפן רק שואל "אפשר להיכנס?", אנחנו עונים "כן" מיד
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // מכאן והלאה הלוגיקה הרגילה
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tracking_id, subject } = req.body;

  try {
    const { error } = await supabase
      .from('email_tracking')
      .insert([{ tracking_id, subject }]);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
