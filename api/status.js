import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'Missing ids' });

    const idList = ids.split(',');

    // שליפת הנתונים הכלליים
    const { data: emails } = await supabase
        .from('emails')
        .select('id, opens_count, created_at') // וודא שהשמות תואמים לטבלה שלך
        .in('id', idList);

    // שליפת היסטוריית הפתיחות המפורטת לכל המיילים הללו
    const { data: history } = await supabase
        .from('email_opens')
        .select('email_id, opened_at')
        .in('email_id', idList)
        .order('opened_at', { ascending: false });

    // איחוד המידע
    const results = emails.map(email => {
        const emailHistory = history
            .filter(h => h.email_id === email.id)
            .map(h => h.opened_at);
        
        return {
            id: email.id,
            opens: email.opens_count, // מספר הפתיחות
            history: emailHistory,     // רשימת הזמנים המלאה
            last_seen: emailHistory[0] || null
        };
    });

    res.status(200).json(results);
}
