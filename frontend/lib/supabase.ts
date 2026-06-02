"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * createSupabaseBrowserClient — creates a Supabase client for the browser.
 * Safe to use in Client Components. Uses Anon Key only.
 * Call this inside a component/hook, not at module level, for SSR compat.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
