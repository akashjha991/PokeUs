"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/frontend/store";
import { createSupabaseBrowserClient } from "@/frontend/lib/supabase";

/**
 * useAuth — initializes auth state from Supabase session on mount.
 * Listens to auth state changes for cross-tab logout / token refresh.
 * Call this once in your dashboard/app layout.
 */
export function useAuth() {
  const { user, couple, checkAuth, logout, setLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createSupabaseBrowserClient();

    // Initial auth check (loads user from server session)
    checkAuth();

    // Listen for auth state changes (login, logout, token refresh, cross-tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        // Session expired or user logged out in another tab
        useAuthStore.setState({ user: null, couple: null, isLoading: false });
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        // Re-fetch user data from our API to get Prisma user + couple
        await checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, couple };
}
