"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Check } from "lucide-react";
import { useAuthStore } from "@/frontend/store";

const MOODS = [
  { emoji: "😍", label: "In Love" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😊", label: "Happy" },
  { emoji: "🥰", label: "Adoring" },
  { emoji: "😌", label: "Content" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "🤒", label: "Sick" },
];

const MOCK_CHART: any[] = [];

export default function MoodPage() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function saveMood() {
    if (!selected) return;
    setLoading(true);
    setSaved(true);
    setLoading(false);
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-6" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Mood Tracker</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>How are you feeling today?</p>
          </div>
          <div className="flex items-center gap-1.5 badge-pill">
            <Flame size={13} />
            <span>{user?.streakDays || 0} day streak</span>
          </div>
        </div>

        {/* Mood Picker */}
        {!saved ? (
          <div className="card p-5">
            <p className="font-semibold mb-4 text-center">Pick your mood</p>
            <div className="grid grid-cols-5 gap-3 mb-5">
              {MOODS.map((mood) => (
                <div key={mood.emoji} className="flex flex-col items-center gap-1">
                  <button
                    className={`mood-emoji ${selected === mood.emoji ? "selected" : ""}`}
                    onClick={() => setSelected(mood.emoji)}
                  >
                    {mood.emoji}
                  </button>
                  <span className="text-xs text-center" style={{ color: "rgb(var(--text-subtle))" }}>{mood.label}</span>
                </div>
              ))}
            </div>
            {selected && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Add a note... (optional)"
                />
                <button onClick={saveMood} disabled={loading} className="btn-brand w-full justify-center py-3">
                  {loading ? "Saving..." : "Log Today's Mood"}
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3 shadow-brand">
              <Check size={28} className="text-white" />
            </div>
            <p className="font-display font-bold text-xl mb-1">Mood Logged!</p>
            <p className="text-4xl mb-1">{selected}</p>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Your partner will see this 💜</p>
          </motion.div>
        )}

        {/* Weekly Chart */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base mb-4">This Week</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={MOCK_CHART}>
              <defs>
                <linearGradient id="youGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d946ef" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="partnerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 10]} />
              <Tooltip
                contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: "12px", color: "rgb(var(--text))" }}
                cursor={false}
              />
              <Area type="monotone" dataKey="you" stroke="#d946ef" strokeWidth={2} fill="url(#youGrad)" name="You" />
              <Area type="monotone" dataKey="partner" stroke="#e11d48" strokeWidth={2} fill="url(#partnerGrad)" name="Partner" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Partner</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
