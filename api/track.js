import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  // אנחנו מכריחים את הדפדפן להראות טקסט
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (!id) {
      return res.status(400).send("שגיאה: לא התקבל מזהה (Missing ID)");
  }

  try {
      // בדיקה 1: האם המזהה קיים בכלל?
      const { data, error: findError } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('tracking_id', id)
        .single();

      if (findError) {
          return res.status(500).send("שגיאה בחיפוש (Select Error): " + JSON.stringify(findError));
      }

      if (!data) {
          return res.status(404).send("לא נמצאה רשומה כזו (No record found). האם המזהה נכון?");
      }

      // בדיקה 2: האם מצליחים לעדכן?
      const { error: updateError } = await supabase
        .from('email_tracking')
        .update({ 
            open_count: (data.open_count || 0) + 1,
            last_opened_at: new Date().toISOString()
        })
        .eq('tracking_id', id);

      if (updateError) {
          return res.status(500).send("שגיאה בעדכון (Update Error): " + JSON.stringify(updateError));
      }

      // הצלחה
      return res.status(200).send("הצלחה! (Success) המספר עודכן ל: " + ((data.open_count || 0) + 1));

  } catch (err) {
      return res.status(500).send("קריסה כללית (System Error): " + err.message);
  }
}
