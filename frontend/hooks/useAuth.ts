"use client";

import { useEffect, useRef } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuthStore } from "@/frontend/store";

/**
 * useAuth — initializes auth state from Clerk session on mount.
 * Listens to Clerk auth state changes for cross-tab logout / session expiry.
 * Call this once in your dashboard/app layout.
 */
export function useAuth() {
  const { user, couple, checkAuth } = useAuthStore();
  const { isSignedIn, isLoaded } = useClerkAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (initialized.current) return;
    initialized.current = true;

    // Initial auth check — loads Prisma user + couple from /api/auth/me
    checkAuth();
  }, [isLoaded]);

  useEffect(() => {
    // React to Clerk sign-out (cross-tab, session expiry)
    if (isLoaded && !isSignedIn) {
      useAuthStore.setState({ user: null, couple: null, isLoading: false });
    }
  }, [isLoaded, isSignedIn]);

  return { user, couple };
}
