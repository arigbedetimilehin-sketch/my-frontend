// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mxqrdaebzpztbilfsqgk.supabase.co"; // 🟢 Replace this
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cXJkYWVienB6dGJpbGZzcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjczMzMsImV4cCI6MjA3MjYwMzMzM30.lyeuQFR0IZAesfJ9zzSrCmJ_neKmcj1PXYE07ReFHfg"; // 🟢 Replace this

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: quick test connection
(async () => {
  try {
    const { error } = await supabase.from("messages").select("*").limit(1);
    if (error) throw error;
    console.log("✅ Supabase connection successful");
  } catch (err) {
    console.warn("⚠️ Supabase connection test failed:", err);
  }
})();

