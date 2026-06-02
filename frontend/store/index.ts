import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Couple } from "@/shared/types";

// ============================================================
// AUTH STORE
// ============================================================
interface AuthState {
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setCouple: (couple: Couple | null) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      couple: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setCouple: (couple) => set({ couple }),
      setLoading: (isLoading) => set({ isLoading }),
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, couple: data.couple, isLoading: false });
          } else {
            set({ user: null, couple: null, isLoading: false });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          set({ user: null, couple: null, isLoading: false });
        }
      },
      logout: async () => {
        try {
          // Trigger local server logout endpoint for route state sync
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
          console.error("Logout error:", err);
        } finally {
          set({ user: null, couple: null, isLoading: false });
        }
      },
    }),
    {
      name: "pokeus-auth",
      partialize: (state) => ({ user: state.user, couple: state.couple }),
    }
  )
);

// ============================================================
// UI STORE
// ============================================================
interface UIState {
  theme: "light" | "dark";
  colorTheme: "purple" | "ocean" | "emerald" | "sunset";
  isChatOpen: boolean;
  isUploadModalOpen: boolean;
  isExpenseModalOpen: boolean;
  isEventModalOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setColorTheme: (colorTheme: "purple" | "ocean" | "emerald" | "sunset") => void;
  setChatOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;
  setExpenseModalOpen: (open: boolean) => void;
  setEventModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "dark",
      colorTheme: "purple",
      isChatOpen: false,
      isUploadModalOpen: false,
      isExpenseModalOpen: false,
      isEventModalOpen: false,
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setChatOpen: (isChatOpen) => set({ isChatOpen }),
      setUploadModalOpen: (isUploadModalOpen) => set({ isUploadModalOpen }),
      setExpenseModalOpen: (isExpenseModalOpen) => set({ isExpenseModalOpen }),
      setEventModalOpen: (isEventModalOpen) => set({ isEventModalOpen }),
    }),
    {
      name: "pokeus-ui",
      partialize: (state) => ({ theme: state.theme, colorTheme: state.colorTheme }),
    }
  )
);

// ============================================================
// CHAT STORE
// ============================================================
interface TypingState {
  isPartnerTyping: boolean;
  setPartnerTyping: (typing: boolean) => void;
}

export const useChatStore = create<TypingState>((set) => ({
  isPartnerTyping: false,
  setPartnerTyping: (isPartnerTyping) => set({ isPartnerTyping }),
}));

// ============================================================
// NOTIFICATION STORE
// ============================================================
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));
