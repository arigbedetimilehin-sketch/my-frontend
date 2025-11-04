// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase credentials
const SUPABASE_URL = "https://mxqrdaebzpztbilfsqgk.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cXJkYWVienB6dGJpbGZzcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjczMzMsImV4cCI6MjA3MjYwMzMzM30.lyeuQFR0IZAesfJ9zzSrCmJ_neKmcj1PXYE07ReFHfg";

// ✅ Create Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Quick test connection
(async () => {
  try {
    const { error } = await supabase.from("messages").select("id").limit(1);
    if (error) throw error;
    console.log("✅ Supabase connection successful");
  } catch (err) {
    console.warn("⚠️ Supabase connection test failed:", err.message);
  }
})();
