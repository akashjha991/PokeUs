"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Share2, RefreshCw, Star, Lightbulb, Trophy, Heart, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/frontend/store";
import { ScrapbookCard } from "@/frontend/components/ScrapbookCard";

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          className="font-display font-black text-4xl text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {score}
        </motion.p>
        <p className="text-white/60 text-xs font-semibold">Love Score</p>
      </div>
    </div>
  );
}

// ─── Highlight Card ───────────────────────────────────────────────────────────
function HighlightCard({ text, index }: { text: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="flex items-start gap-3 p-3 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(217,70,239,0.25)" }}>
        <ChevronRight size={12} className="text-pink-300" />
      </div>
      <p className="text-sm text-white/90 leading-relaxed">{text}</p>
    </motion.div>
  );
}

export default function WrappedPage() {
  const { couple, user } = useAuthStore();
  const [wrapped, setWrapped] = useState<any | null>(null);
  const [weekRange, setWeekRange] = useState("");
  const [coupleName, setCoupleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wrapped");
        const data = await res.json();
        if (res.ok && data.wrapped) {
          setWrapped(data.wrapped);
          setWeekRange(data.weekRange ?? "");
          setCoupleName(data.coupleName ?? "");
        } else {
          setError(data.error || "Failed to generate your Wrapped");
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleShare() {
    if (!wrapped?.shareableSummary) return;
    const text = `✨ Our PokeUs Week Wrapped ✨\n\n${wrapped.shareableSummary}\n\n— Sent with PokeUs 💜`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Copied to clipboard! Share it anywhere 💜");
      });
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={36} style={{ color: "#d946ef" }} />
          </motion.div>
          <div className="text-center">
            <p className="font-display font-bold text-lg" style={{ color: "rgb(var(--text))" }}>
              Creating your Wrapped ✨
            </p>
            <p className="text-sm mt-1" style={{ color: "rgb(var(--text-muted))" }}>
              Analysing your week together…
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!couple) {
    return (
      <AppShell>
        <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Heart size={48} style={{ color: "#d946ef" }} />
          <p className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>
            Connect with a partner first 💜
          </p>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
            Couple Wrapped generates once you're both linked together in PokeUs.
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !wrapped) {
    return (
      <AppShell>
        <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>
            Couldn't generate this week's Wrapped 😔
          </p>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
            {error ?? "Try again in a moment."}
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="btn-brand px-5 py-2.5 text-sm mt-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-28 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Hero gradient card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 text-center space-y-5 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #4a1168 0%, #7c1457 50%, #1a0633 100%)" }}
        >
          {/* Decorative sparkles */}
          {["top-3 left-4", "top-5 right-6", "bottom-6 left-8", "bottom-4 right-5"].map((pos, i) => (
            <motion.div
              key={i}
              className={`absolute ${pos} text-white/20 text-lg select-none`}
              animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.5 + i * 0.5, repeat: Infinity }}
            >
              ✦
            </motion.div>
          ))}

          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-semibold uppercase tracking-widest text-pink-300/80 mb-1"
            >
              PokeUs · {weekRange}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display font-black text-2xl text-white leading-tight"
            >
              {coupleName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-pink-200/70 mt-0.5"
            >
              Weekly Wrapped 💜
            </motion.p>
          </div>

          <ScoreRing score={wrapped.relationshipScore ?? 80} />

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-base font-bold text-white leading-snug"
          >
            {wrapped.headline}
          </motion.p>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-4 space-y-2"
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#d946ef" }}>
            <Star size={12} /> This Week's Highlights
          </p>
          {(wrapped.highlights ?? []).map((h: string, i: number) => (
            <HighlightCard key={i} text={h} index={i} />
          ))}
        </motion.div>

        {/* Insight */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
          style={{ borderLeft: "3px solid #d946ef" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: "#8b5cf6" }}>
            <Lightbulb size={12} /> Relationship Insight
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text))" }}>
            {wrapped.insight}
          </p>
        </motion.div>

        {/* Achievement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl p-5 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,70,239,0.1) 100%)", border: "1px solid rgba(245,158,11,0.25)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.2)" }}>
            <Trophy size={26} style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>This Week's Achievement</p>
            <p className="font-bold text-sm" style={{ color: "rgb(var(--text))" }}>{wrapped.achievement}</p>
          </div>
        </motion.div>

        {/* Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: "#10b981" }}>
            💡 This Week's Suggestion
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text))" }}>
            {wrapped.suggestion}
          </p>
        </motion.div>

        {/* Share CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3"
        >
          <div className="rounded-2xl p-4 text-sm italic leading-relaxed text-center"
            style={{ background: "rgb(var(--surface-muted))", color: "rgb(var(--text-muted))" }}>
            "{wrapped.shareableSummary}"
          </div>

          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #d946ef, #e11d48)" }}
          >
            <Share2 size={18} />
            Share Our Wrapped 💜
          </button>
        </motion.div>

        {/* Scrapbook Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1" style={{ background: "rgb(var(--border))" }} />
            <p className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: "rgb(var(--text-muted))" }}>✦ Shareable Card ✦</p>
            <div className="h-px flex-1" style={{ background: "rgb(var(--border))" }} />
          </div>
          <ScrapbookCard
            userName={user?.name ?? "You"}
            userAvatar={user?.avatar}
            partnerName={(couple?.user1?.id === user?.id ? couple?.user2?.name : couple?.user1?.name) ?? "Partner"}
            partnerAvatar={couple?.user1?.id === user?.id ? couple?.user2?.avatar : couple?.user1?.avatar}
            weekRange={weekRange}
            score={wrapped.relationshipScore ?? 80}
            headline={wrapped.headline ?? ""}
            highlights={wrapped.highlights ?? []}
          />
        </motion.div>
      </div>
    </AppShell>
  );
}
