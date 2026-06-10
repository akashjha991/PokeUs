"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Image, Sparkles, LayoutDashboard, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuthStore, useNotificationStore } from "@/frontend/store";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/memories", icon: Image, label: "Memories" },
  { href: "/wrapped", icon: Sparkles, label: "Wrapped" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { checkAuth, user, couple } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && couple) {
      fetch("/api/chat/unread")
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(console.error);
    }
  }, [user, couple, setUnreadCount]);

  const isChat = pathname === "/chat";

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-[100dvh]" style={{ background: "rgb(var(--background))" }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgb(var(--brand))", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className={`flex-1 ${isChat ? "" : "pb-[var(--nav-height)]"}`}>
        {children}
      </main>
      {!isChat && (
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                <div className="relative">
                  <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {item.href === "/chat" && unreadCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1.5 bg-[#ef4444] text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 z-10"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500"
                    />
                  )}
                </div>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
