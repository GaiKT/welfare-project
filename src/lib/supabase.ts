import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client Configuration
 * Used for file storage operations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Public client for client-side operations (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (full permissions)
// Only use this on the server side!
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Get the Supabase admin client
 * Throws an error if the service role key is not configured
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Server-side storage operations require the service role key."
    );
  }
  return supabaseAdmin;
}
