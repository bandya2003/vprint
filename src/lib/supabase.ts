
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

console.log("Attempting to load Supabase URL from env:", supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : undefined); // Log a portion for verification

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
