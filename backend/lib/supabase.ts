import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Warning: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Using placeholders for build compatibility."
  );
}

/**
 * supabaseAdmin — server-side only, uses Service Role Key.
 * Bypasses Row Level Security. Never expose this on the client.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "https://vfwzdhivegfbhaspuhev.supabase.co",
  supabaseServiceKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
