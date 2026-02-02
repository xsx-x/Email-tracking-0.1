import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
      return res.status(400).send("Error: No ID provided");
  }

  // ניסיון ישיר לעדכן
  try {
      // שלב א: נראה אם הרשומה קיימת בכלל
      const { data, error: findError } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('tracking_id', id)
        .single();

      if (findError) {
          return res.status(500).send("Error Finding: " + JSON.stringify(findError));
      }

      // שלב ב: ננסה לעדכן
      const { error: updateError } = await supabase
        .from('email_tracking')
        .update({ open_count: (data.open_count || 0) + 1 })
        .eq('tracking_id', id);

      if (updateError) {
          return res.status(500).send("Error Updating: " + JSON.stringify(updateError));
      }

      // אם הגענו לפה - הכל עבד!
      return res.status(200).send("SUCCESS! Count updated. Go check the table.");

  } catch (err) {
      return res.status(500).send("System Error: " + err.message);
  }
}
