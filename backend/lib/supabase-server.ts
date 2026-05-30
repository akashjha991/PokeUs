import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * createSupabaseServerClient — creates a Supabase client for use inside
 * Next.js Route Handlers and Server Components.
 * Uses @supabase/ssr to read/write session cookies automatically.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from Server Components where cookies are read-only.
            // This is safe to ignore — middleware handles session refresh.
          }
        },
      },
    }
  );
}
