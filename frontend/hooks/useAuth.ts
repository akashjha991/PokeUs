"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/frontend/store";

/**
 * useAuth — hook to fetch the current user and couple on mount.
 * Call this once in your dashboard/app layout.
 */
export function useAuth() {
  const { user, couple, setUser, setCouple, setLoading } = useAuthStore();

  useEffect(() => {
    async function fetchMe() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.user);
        setCouple(data.couple);
      } catch {
        // Not authenticated — stays null
      } finally {
        setLoading(false);
      }
    }
    if (!user) fetchMe();
    else setLoading(false);
  }, []);

  return { user, couple };
}
