import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://mxqrdaebzpztbilfsqgk.supabase.co", // ✅ Replace this with your real URL
  "sb_publishable_OS5UUiiy2HcQtQDc0fkHUA_fcG8mVKW"                    // ✅ Replace this with your real anon key
);
