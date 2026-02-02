import { createClient } from '@supabase/supabase-js';

// יצירת הקליינט
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // וידוא שהבקשה היא לא סתם דפדפן שמנסה להוריד אייקון
  // למרות שזה לא קריטי לבדיקה שלנו, זה טוב לסדר הטוב
  
  const { id, subject } = req.query;

  // בדיקה אם המשתנים בכלל נטענו
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return res.status(500).json({ 
      error: "Missing Environment Variables", 
      details: "SUPABASE_URL or KEY is undefined on server" 
    });
  }

  if (!id) {
    return res.status(400).json({ error: "Missing 'id' parameter" });
  }

  try {
    // נסיון כתיבה לטבלה
    const { data, error } = await supabase
      .from('email_tracking')
      .insert([
        { 
          tracking_id: id, 
          subject: subject || 'No Subject',
          open_count: 0 
        }
      ])
      .select();

    if (error) {
      // אם יש שגיאה מ-Supabase, נציג אותה
      console.error("Supabase Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details 
      });
    }

    // הצלחה
    return res.status(200).json({ 
      success: true, 
      message: "Row created successfully", 
      data: data 
    });

  } catch (err) {
    // שגיאה כללית בקוד
    return res.status(500).json({ 
      success: false, 
      error: "Server Internal Error", 
      message: err.message 
    });
  }
}
