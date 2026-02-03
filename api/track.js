import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { id } = req.query;

    if (id) {
        // 1. עדכון מונה הצפיות הכללי
        await supabase.rpc('increment_opens', { row_id: id });

        // 2. שמירת תיעוד של הזמן המדויק בהיסטוריה (בלוג)
        // שים לב: עליך ליצור טבלה בשם 'email_opens' עם עמודות: email_id (text), opened_at (timestamp)
        await supabase.from('email_opens').insert([
            { email_id: id, opened_at: new Date().toISOString() }
        ]);
    }

    // החזרת פיקסל שקוף
    const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.status(200).send(img);
}
