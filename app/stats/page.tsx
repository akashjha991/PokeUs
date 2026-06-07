"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BarChart2, Heart, MessageCircle, Image, Target, Star, Zap, Flame, TrendingUp, BookOpen } from "lucide-react";
import { useAuthStore } from "@/frontend/store";
import { getXPLevel } from "@/backend/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MOOD_COLORS: Record<string, string> = {
  happy: "#10b981", excited: "#f59e0b", calm: "#3b82f6",
  sad: "#6366f1", anxious: "#ef4444", angry: "#e11d48", tired: "#8b5cf6", neutral: "#6b7280",
};

export default function StatsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const xpInfo = getXPLevel(user?.xpPoints || 0);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const moodPieData = stats
    ? Object.entries(stats.moodBreakdown || {}).map(([name, value]) => ({ name, value }))
    : [];

  const messageData = stats
    ? [
        { name: "You", count: stats.myMessages || 0, fill: "#d946ef" },
        { name: "Partner", count: stats.partnerMessages || 0, fill: "#e11d48" },
      ]
    : [];

  const STAT_CARDS = stats ? [
    { label: "Days Together", value: stats.daysTogether, icon: Heart, color: "#e11d48" },
    { label: "Messages Sent", value: stats.messageCount, icon: MessageCircle, color: "#d946ef" },
    { label: "Memories Made", value: stats.memoryCount, icon: Image, color: "#f59e0b" },
    { label: "Goals Achieved", value: `${stats.goalsCompleted}/${stats.goalCount}`, icon: Target, color: "#10b981" },
    { label: "Journal Entries", value: stats.journalCount, icon: BookOpen, color: "#8b5cf6" },
    { label: "Events Planned", value: stats.calendarCount, icon: Star, color: "#3b82f6" },
  ] : [];

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        <div>
          <h1 className="font-display font-bold text-2xl">Relationship Stats</h1>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Your story by the numbers</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map((i) => <div key={i} className="card h-24 skeleton" />)}
            </div>
            <div className="card h-48 skeleton" />
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 size={48} style={{ color: "rgb(var(--text-subtle))" }} className="mb-4" />
            <p className="text-lg font-bold mb-2">No stats yet</p>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Start using PokeUs to build your story</p>
          </div>
        ) : (
          <>
            {/* XP Level Banner */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-5"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/70 text-sm">Relationship Level</p>
                  <p className="text-white font-display font-bold text-2xl">Level {xpInfo.level} · {xpInfo.title}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Star size={28} className="text-white fill-white" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInfo.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-white/70 text-xs">{user?.xpPoints} XP</span>
                <span className="text-white/70 text-xs">{Math.round(xpInfo.nextLevelXP - (user?.xpPoints || 0))} XP to next</span>
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="card p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <Flame size={26} style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <p className="font-display font-bold text-3xl" style={{ color: "#f59e0b" }}>{stats.streakDays}</p>
                <p className="text-sm font-semibold">Day Streak 🔥</p>
                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Keep the flame alive!</p>
              </div>
            </motion.div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-3">
              {STAT_CARDS.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                      <card.icon size={16} style={{ color: card.color }} />
                    </div>
                    <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{card.label}</span>
                  </div>
                  <p className="font-display font-bold text-2xl">{card.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Message Breakdown */}
            {stats.messageCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card p-4">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <MessageCircle size={18} style={{ color: "#d946ef" }} />
                  Message Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={messageData} barSize={40}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "rgb(var(--text-muted))" }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {messageData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Mood Pie */}
            {moodPieData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card p-4">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <TrendingUp size={18} style={{ color: "#3b82f6" }} />
                  Mood Distribution (30d)
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={moodPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} paddingAngle={3}>
                      {moodPieData.map((entry, i) => (
                        <Cell key={i} fill={MOOD_COLORS[entry.name.toLowerCase()] || "#8b5cf6"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "rgb(var(--text-muted))", fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
