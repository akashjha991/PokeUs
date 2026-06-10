"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Lightbulb, 
  Trophy, 
  Heart, 
  BookOpen
} from "lucide-react";
import { useAuthStore } from "@/frontend/store";
import WrappedContainer from "@/frontend/components/wrapped/WrappedContainer";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";

const AVAILABLE_THEMES = [
  { id: "storybook", name: "Storybook", desc: "Pinterest fairytale", emoji: "📖" },
  { id: "scrapbook", name: "Scrapbook", desc: "Handmade memories", emoji: "🎨" },
  { id: "loveletter", name: "Love Letter", desc: "Wax seal romance", emoji: "✉️" },
  { id: "timeline", name: "Timeline", desc: "Memory lane path", emoji: "📍" },
  { id: "polaroid", name: "Polaroid Wall", desc: "Overlapping snaps", emoji: "📌" },
  { id: "constellation", name: "Constellation", desc: "Starry alignment", emoji: "🌌" },
];

export default function WrappedPage() {
  const { couple, user } = useAuthStore();
  const [wrappedData, setWrappedData] = useState<RelationshipData | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active theme selection
  const [selectedTheme, setSelectedTheme] = useState("storybook");
  // Load wrapped statistics
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wrapped");
        const json = await res.json();
        if (res.ok && json.data) {
          setWrappedData(json.data);
          setAiSummary(json.aiSummary);
          // Randomly select initial theme
          const randomTheme = AVAILABLE_THEMES[Math.floor(Math.random() * AVAILABLE_THEMES.length)].id;
          setSelectedTheme(randomTheme);
        } else {
          setError(json.error || "Failed to generate your Wrapped data");
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={36} className="text-pink-500" />
          </motion.div>
          <div className="text-center space-y-1">
            <p className="font-display font-bold text-lg text-white">
              Creating your Relationship Wrapped ✨
            </p>
            <p className="text-sm text-[#B0A5D0]">
              Analyzing your messages, memories &amp; connection...
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
          <Heart size={48} className="text-pink-500 fill-current" />
          <p className="font-display font-bold text-xl text-white">
            Connect with a partner first 💜
          </p>
          <p className="text-sm text-[#B0A5D0]">
            Weekly Wrapped requires you to be linked with your partner in PokeUs.
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !wrappedData || !aiSummary) {
    return (
      <AppShell>
        <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display font-bold text-xl text-white">
            Couldn't generate this week's Wrapped 😔
          </p>
          <p className="text-sm text-[#B0A5D0]">
            {error ?? "Make sure you both have shared some activity this week."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-brand px-5 py-2.5 text-sm mt-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const partnerName = (couple?.user1?.id === user?.id ? couple?.user2?.name : couple?.user1?.name) ?? "Partner";

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-28 space-y-6 max-w-md mx-auto text-white">
        {/* Page title header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 px-4 py-1.5 rounded-full text-pink-300 font-bold text-sm uppercase tracking-wider">
            <Heart size={14} className="fill-current text-pink-400" />
            Weekly Love summary
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
            PokeUs Wrapped
          </h1>
          <p className="text-sm text-[#B0A5D0]">
            Your weekly love diary &amp; scrapbook
          </p>
        </div>

        {/* Live Scaled Preview of Selected Theme */}
        <div className="relative overflow-hidden w-full flex justify-center">
          <WrappedContainer
            data={wrappedData}
            aiSummary={aiSummary}
            theme={selectedTheme}
            isExportMode={false}
          />
          
        </div>

        {/* Theme Selector (horizontal scrolling buttons) */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            🎨 Choose Your Card Theme
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {AVAILABLE_THEMES.map((theme) => {
              const active = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`snap-start flex-shrink-0 px-4 py-3 rounded-2xl flex flex-col items-start gap-1 transition-all ${
                    active 
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold scale-[1.03] border-none"
                      : "bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800"
                  }`}
                  style={{ minWidth: "120px" }}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="text-sm font-semibold">{theme.name}</span>
                  <span className="text-[10px] opacity-70 font-light">{theme.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Narrative and Stats */}
        <div className="space-y-4 pt-4">
          <div className="h-px bg-white/10" />
          <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            📖 This Week's Narrative
          </p>

          {/* AI Diary story detail */}
          <div 
            className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3"
            style={{ borderLeft: "4px solid #d946ef" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#d946ef] flex items-center gap-1.5">
              <BookOpen size={12} /> Chapter Summary
            </p>
            <h3 className="font-bold text-md text-white">&ldquo;{aiSummary.title}&rdquo;</h3>
            <p className="text-sm text-[#B0A5D0] leading-relaxed">
              {aiSummary.story}
            </p>
          </div>

          {/* Unlocked Achievement */}
          <div 
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-400">Relationship Achievement</p>
              <p className="font-bold text-sm text-white mt-0.5">{aiSummary.achievement}</p>
            </div>
          </div>

          {/* Connection Insight */}
          <div 
            className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-2"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#8b5cf6] flex items-center gap-1.5">
              <Lightbulb size={12} /> Weekly Insight
            </p>
            <p className="text-sm text-[#B0A5D0] leading-relaxed">
              {aiSummary.insight}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
