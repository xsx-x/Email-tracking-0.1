import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { id } = req.query;

    // --- התיקון הקריטי: ביטול שמירה בזיכרון (Cache) ---
    // השורות האלו מכריחות את הדפדפן/ג'ימייל לפנות לשרת בכל פעם מחדש
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    if (id) {
        try {
            // 1. שמירת תיעוד בטבלת ההיסטוריה
            // אנחנו משתמשים ב-Promise.all כדי לבצע את שתי הפעולות במקביל למהירות
            await Promise.all([
                supabase.from('email_opens').insert([
                    { email_id: id, opened_at: new Date().toISOString() }
                ]),
                supabase.rpc('increment_opens', { row_id: id })
            ]);

        } catch (error) {
            console.error("Error tracking open:", error);
            // אנחנו לא עוצרים את הפונקציה כדי שהתמונה עדיין תישלח
        }
    }

    // החזרת פיקסל שקוף
    const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.status(200).send(img);
}
