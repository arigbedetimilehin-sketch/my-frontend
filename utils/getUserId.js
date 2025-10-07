// utils/getUserId.js
import { supabase } from '../supabaseClient';

export async function getUserId() {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return userData?.user?.id ?? null;
}