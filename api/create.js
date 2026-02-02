import { createClient } from '@supabase/supabase-js';

// הגדרת משתני סביבה
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // --- החלק החדש והחשוב: אישורי CORS ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // מתיר לכולם (כולל ג'ימייל) לפנות
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // טיפול ב"בדיקה המקדימה" של הדפדפן (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --------------------------------------

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tracking_id, subject } = req.body;

  if (!tracking_id) {
    return res.status(400).json({ error: 'Missing tracking_id' });
  }

  try {
    const { error } = await supabase
      .from('email_tracking')
      .insert([{ tracking_id, subject }]);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error creating record:', error);
    return res.status(500).json({ error: error.message });
  }
}
