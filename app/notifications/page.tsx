"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { useAuthStore, useNotificationStore } from "@/frontend/store";
import { getXPLevel } from "@/backend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle, Heart, Zap, Flame, Trophy, Bell, ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, couple, setCouple } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const partner = couple ? (couple.user1.id === user?.id ? couple.user2 : couple.user1) : null;
  const xpInfo = getXPLevel(user?.xpPoints || 0);

  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!couple && user) {
      setLoading(true);
      fetch("/api/couple/invite")
        .then(res => res.json())
        .then(data => {
          if (data.invites) setInvites(data.invites);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [couple, user]);

  async function handleAccept(inviteId: string) {
    try {
      const res = await fetch("/api/couple/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Invitation accepted! 💜");
        setCouple(data.couple);
      } else {
        toast.error(data.error || "Failed to accept invite");
      }
    } catch (e) {
      toast.error("Something went wrong");
    }
  }

  async function handleDecline(inviteId: string) {
    try {
      const res = await fetch("/api/couple/invite/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId })
      });
      if (res.ok) {
        setInvites(invites.filter(i => i.id !== inviteId));
        toast.success("Invitation declined");
      }
    } catch (e) {
      toast.error("Something went wrong");
    }
  }

  // Compile list of notifications
  const notificationItems: any[] = [];

  // 1. Invites
  if (!couple && invites.length > 0) {
    invites.forEach(invite => {
      notificationItems.push({
        id: `invite-${invite.id}`,
        type: "invite",
        title: "Connection Invitation",
        description: `${invite.sender.name} (${invite.sender.email}) wants to connect their private space with you!`,
        icon: Heart,
        color: "#d946ef",
        bg: "rgba(217,70,239,0.1)",
        action: (
          <div className="flex gap-2 mt-3 w-full">
            <button onClick={() => handleAccept(invite.id)} className="btn-brand flex-1 py-2 text-xs">Accept 💜</button>
            <button onClick={() => handleDecline(invite.id)} className="flex-1 py-2 text-xs rounded-xl font-medium" style={{ background: "rgb(var(--surface-muted))" }}>Decline</button>
          </div>
        )
      });
    });
  }

  // 2. Unread messages
  if (unreadCount > 0) {
    notificationItems.push({
      id: "chat-unread",
      type: "chat",
      title: "New Messages",
      description: `You have ${unreadCount} unread message(s) waiting in your private chat.`,
      icon: MessageCircle,
      color: "#d946ef",
      bg: "rgba(217,70,239,0.1)",
      link: "/chat"
    });
  }

  // 3. Couple Connected
  if (couple && partner) {
    notificationItems.push({
      id: "couple-connected",
      type: "couple",
      title: "Successfully Connected!",
      description: `You and ${partner.name} are now connected. Start chatting, sharing memories, and tracking moods!`,
      icon: Heart,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      link: "/dashboard"
    });
  }

  // 4. Level Up
  if (user && user.xpPoints > 0) {
    notificationItems.push({
      id: "level-up",
      type: "xp",
      title: `Level Achieved: Level ${xpInfo.level}`,
      description: `You reached Level ${xpInfo.level} (${xpInfo.title})! Earn more XP by interacting in the app.`,
      icon: Zap,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)"
    });
  }

  // 5. Streaks
  if (user && user.streakDays > 0) {
    notificationItems.push({
      id: "streak",
      type: "streak",
      title: `${user.streakDays} Day Love Streak!`,
      description: "You're keeping the fire alive! Check in daily with your partner to build your connection.",
      icon: Flame,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)"
    });
  }

  // 6. Badges (Static premium badges)
  notificationItems.push({
    id: "badge-firstweek",
    type: "badge",
    title: "Badge Earned: First Week",
    description: "Welcome to PokeUs! You've unlocked the First Week badge for starting your relationship space.",
    icon: Trophy,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)"
  });

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: "rgb(var(--surface-muted))" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl">Notifications</h1>
            <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Your private updates & activity logs</p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgb(var(--brand))", borderTopColor: "transparent" }}></div>
              </div>
            ) : notificationItems.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: "rgb(var(--text-muted))" }}>
                <Bell size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No new notifications at this time.</p>
              </div>
            ) : (
              notificationItems.map((item, index) => {
                const IconComponent = item.icon;
                const content = (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}
                    >
                      <IconComponent size={20} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
                        {item.description}
                      </p>
                      {item.action && item.action}
                    </div>
                  </div>
                );

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="card p-4 block"
                  >
                    {item.link ? (
                      <Link href={item.link} className="cursor-pointer">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
