"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { useAuthStore } from "@/frontend/store";
import { useSocket } from "@/frontend/providers/SocketProvider";
import { getXPLevel, getInitials } from "@/backend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle, Image, Smile, DollarSign, Calendar, StickyNote,
  Flame, Star, Bell, Heart, Zap, Trophy, Target, BookOpen,
  Archive, Gamepad2, BarChart2, Hand, ChevronRight, Send, Clock
} from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/chat",     icon: MessageCircle, label: "Chat",     color: "#d946ef", bg: "rgba(217,70,239,0.15)" },
  { href: "/memories", icon: Image,         label: "Memories", color: "#e11d48", bg: "rgba(225,29,72,0.15)" },
  { href: "/mood",     icon: Smile,         label: "Mood",     color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { href: "/expenses", icon: DollarSign,    label: "Expenses", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  { href: "/calendar", icon: Calendar,      label: "Calendar", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  { href: "/notes",    icon: StickyNote,    label: "Notes",    color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  { href: "/goals",    icon: Target,        label: "Goals",    color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { href: "/journal",  icon: BookOpen,      label: "Journal",  color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  { href: "/capsule",  icon: Archive,       label: "Capsule",  color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  { href: "/games",    icon: Gamepad2,      label: "Games",    color: "#e11d48", bg: "rgba(225,29,72,0.15)" },
  { href: "/stats",    icon: BarChart2,     label: "Stats",    color: "#10b981", bg: "rgba(16,185,129,0.15)" },
];

const MOCK_ACTIVITY: any[] = [];

export default function DashboardPage() {
  const { user, couple, setCouple } = useAuthStore();
  const { socket } = useSocket();
  const partner = couple ? (couple.user1.id === user?.id ? couple.user2 : couple.user1) : null;
  const xpInfo = getXPLevel(user?.xpPoints || 0);

  const [invites, setInvites] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Hello");

  // Poke
  const [pokeEmoji, setPokeEmoji] = useState("👉");
  const [isSendingPoke, setIsSendingPoke] = useState(false);
  const [lastPoke, setLastPoke] = useState<any | null>(null);

  // Daily Question
  const [dailyQ, setDailyQ] = useState<any | null>(null);
  const [myAnswer, setMyAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Flashback
  const [flashback, setFlashback] = useState<any | null>(null);

  useEffect(() => {
    if (!couple && user) {
      fetch("/api/couple/invite")
        .then(res => res.json())
        .then(data => { if (data.invites) setInvites(data.invites); })
        .catch(console.error);
    }
  }, [couple, user]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Activities
  const [activities, setActivities] = useState<any[]>([]);

  // Load daily question + flashback + activities if in a couple
  useEffect(() => {
    if (!couple) return;
    fetch("/api/daily-question")
      .then((r) => r.json())
      .then((d) => {
        if (d.question) {
          setDailyQ(d);
          const mine = d.answers?.find((a: any) => a.userId === d.myUserId);
          if (mine) { setMyAnswer(mine.answer); setSubmitted(true); }
        }
      }).catch(console.error);

    fetch("/api/flashback")
      .then((r) => r.json())
      .then((d) => { if (d.memories?.length > 0 || d.moods?.length > 0) setFlashback(d); })
      .catch(console.error);

    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => { if (d.activities) setActivities(d.activities); })
      .catch(console.error);
  }, [couple]);



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

  async function sendPoke() {
    if (isSendingPoke) return;
    setIsSendingPoke(true);
    try {
      const res = await fetch("/api/poke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: pokeEmoji }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastPoke(data.poke);
        toast.success(`${pokeEmoji} Poke sent to ${partner?.name}!`);
        if (couple) {
          socket?.emit("send_poke", {
            poke: data.poke,
            coupleId: couple.id,
            senderName: user?.name,
            emoji: pokeEmoji,
          });
        }
      } else {
        toast.error(data.error || "Failed to poke");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setIsSendingPoke(false); }
  }

  async function submitAnswer() {
    if (!myAnswer.trim() || !dailyQ?.question?.id) return;
    setSubmittingAnswer(true);
    try {
      const res = await fetch("/api/daily-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: dailyQ.question.id, answer: myAnswer }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        toast.success("Answer saved! 💜");
      } else {
        toast.error(data.error || "Failed to save answer");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSubmittingAnswer(false); }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "rgb(var(--text-muted))" }}>{greeting}</p>
            <h1 className="font-display font-bold text-2xl">{user?.name?.split(" ")[0] || "Hey"} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgb(var(--surface-muted))" }}>
              <Bell size={18} style={{ color: "rgb(var(--text-muted))" }} />
            </Link>
          </div>
        </div>

        {/* COUPLE CARD OR INVITES */}
        {couple && partner ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #d946ef 0%, #e11d48 100%)" }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : getInitials(user?.name || "U")}
                  </div>
                  <Heart size={20} className="text-white/60 fill-white/60 animate-bounce-gentle" />
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {partner.avatar ? (
                      <img src={partner.avatar} alt={partner.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : getInitials(partner.name)}
                  </div>
                </div>
                <div className="badge-pill" style={{ background: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
                  <Flame size={11} />
                  <span>{user?.streakDays || 0} day streak</span>
                </div>
              </div>
              <p className="text-white/80 text-sm">Together with</p>
              <p className="text-white font-bold text-xl">{partner.name} 💜</p>
            </div>
          </motion.div>
        ) : invites.length > 0 ? (
          <div className="space-y-4">
            {invites.map(invite => (
              <motion.div key={invite.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 border" style={{ borderColor: "rgba(217,70,239,0.3)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold text-lg">
                    {invite.sender.avatar ? <img src={invite.sender.avatar} className="w-full h-full object-cover rounded-2xl" /> : getInitials(invite.sender.name)}
                  </div>
                  <div>
                    <p className="font-bold">{invite.sender.name}</p>
                    <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>wants to connect with you</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(invite.id)} className="btn-brand flex-1 py-2.5">Accept 💜</button>
                  <button onClick={() => handleDecline(invite.id)} className="flex-1 py-2.5 rounded-xl font-medium" style={{ background: "rgb(var(--surface-muted))" }}>Decline</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 text-center"
          >
            <p className="text-3xl mb-2">💌</p>
            <p className="font-semibold mb-1">Invite your partner</p>
            <p className="text-sm mb-4" style={{ color: "rgb(var(--text-muted))" }}>Share your private space with someone special</p>
            <Link href="/profile" className="btn-brand text-sm py-2.5 px-6">Send Invite</Link>
          </motion.div>
        )}

        {/* XP BAR */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Level {xpInfo.level} — {xpInfo.title}</p>
                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{user?.xpPoints || 0} XP</p>
              </div>
            </div>
            <span className="badge-pill text-xs"><Star size={10} /> {xpInfo.level}</span>
          </div>
          <div className="xp-bar-track">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpInfo.progress}%` }}
              transition={{ duration: 1.2, delay: 0.3 }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "rgb(var(--text-subtle))" }}>
            {Math.round(xpInfo.nextLevelXP - (user?.xpPoints || 0))} XP to next level
          </p>
        </div>

        {/* POKE WIDGET — only show when in a couple */}
        {couple && partner && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm flex items-center gap-2"><Hand size={16} style={{ color: "#d946ef" }} /> Poke {partner.name}</p>
              <div className="flex gap-1">
                {["👉","💜","😘","🔥","💋"].map((e) => (
                  <button key={e} onClick={() => setPokeEmoji(e)} className="text-xl transition-transform" style={{ transform: pokeEmoji === e ? "scale(1.4)" : "scale(1)", opacity: pokeEmoji !== e ? 0.5 : 1 }}>{e}</button>
                ))}
              </div>
            </div>
            <button
              onClick={sendPoke}
              disabled={isSendingPoke}
              className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #d946ef, #e11d48)", color: "white", opacity: isSendingPoke ? 0.7 : 1 }}
            >
              <Send size={16} /> {isSendingPoke ? "Sending..." : `Send a ${pokeEmoji} Poke`}
            </button>
            {lastPoke && <p className="text-xs text-center mt-2" style={{ color: "rgb(var(--text-subtle))" }}>Poke sent! 💜</p>}
          </motion.div>
        )}

        {/* DAILY QUESTION WIDGET */}
        {couple && dailyQ?.question && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: "#8b5cf6" }}>
              <Star size={12} /> Daily Question
            </p>
            <p className="font-bold text-sm mb-3">{dailyQ.question.question}</p>
            {submitted ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl" style={{ background: "rgba(217,70,239,0.08)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "rgb(var(--text-muted))" }}>Your answer</p>
                  <p className="text-sm">{myAnswer}</p>
                </div>
                {dailyQ.answers?.filter((a: any) => a.userId !== dailyQ.myUserId).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-xl" style={{ background: "rgba(225,29,72,0.07)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "rgb(var(--text-muted))" }}>{a.user?.name}'s answer</p>
                    <p className="text-sm">{a.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={myAnswer} onChange={(e) => setMyAnswer(e.target.value)} className="input-field flex-1 py-2 text-sm" placeholder="Your answer..." onKeyDown={(e) => e.key === "Enter" && submitAnswer()} />
                <button onClick={submitAnswer} disabled={submittingAnswer || !myAnswer.trim()} className="btn-brand px-4 py-2 text-sm flex-shrink-0">
                  {submittingAnswer ? "..." : <Send size={14} />}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* FLASHBACK WIDGET */}
        {flashback?.memories?.[0] && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
            <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: "#f59e0b" }}>
              <Clock size={12} /> This Day Last Year
            </p>
            {flashback.memories[0].photos?.[0]?.url && (
              <div className="h-28 rounded-2xl overflow-hidden mb-3">
                <img src={flashback.memories[0].photos[0].url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="font-bold text-sm">{flashback.memories[0].title}</p>
            {flashback.memories[0].caption && <p className="text-xs mt-1" style={{ color: "rgb(var(--text-muted))" }}>{flashback.memories[0].caption}</p>}
            <Link href="/memories" className="text-xs mt-2 flex items-center gap-1" style={{ color: "#d946ef" }}>
              View all memories <ChevronRight size={12} />
            </Link>
          </motion.div>
        )}

        {/* QUICK ACTIONS */}
        <div>
          <h2 className="font-display font-bold text-base mb-3">Quick Access</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95"
                  style={{ background: action.bg, border: `1px solid ${action.color}25` }}
                >
                  <action.icon size={24} style={{ color: action.color }} />
                  <span className="text-xs font-semibold" style={{ color: action.color }}>{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div>
          <h2 className="font-display font-bold text-base mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "rgb(var(--text-muted))" }}>No recent activity yet 🌸</p>
            ) : (
              activities.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="card flex items-center gap-3 p-3.5"
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>{item.dateStr}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
