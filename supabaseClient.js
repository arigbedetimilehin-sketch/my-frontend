import { createClient } from '@supabase/supabase-js';

// Use NEXT_PUBLIC_ for frontend/client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
