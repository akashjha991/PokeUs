"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Share2, 
  Download, 
  RefreshCw, 
  Star, 
  Lightbulb, 
  Trophy, 
  Heart, 
  Image as ImageIcon,
  CheckCircle,
  Copy,
  ChevronRight,
  BookOpen,
  Send
} from "lucide-react";
import { toast } from "sonner";
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

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

  // Export card to PNG via server Playwright API
  async function triggerExport(themeId: string): Promise<string | null> {
    try {
      setIsExporting(true);
      const res = await fetch("/api/wrapped/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId }),
      });
      const json = await res.json();
      if (res.ok && json.data?.url) {
        return json.data.url;
      } else {
        toast.error(json.error || "Failed to export image");
        return null;
      }
    } catch {
      toast.error("Export service failed");
      return null;
    } finally {
      setIsExporting(false);
    }
  }

  // Action: Download card
  async function handleDownload() {
    const url = await triggerExport(selectedTheme);
    if (!url) return;

    // Trigger download in browser
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `pokeus-wrapped-${selectedTheme}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    toast.success("Card downloaded successfully! 📸");
  }

  // Action: Copy image link
  async function handleCopyLink() {
    const url = await triggerExport(selectedTheme);
    if (!url) return;

    navigator.clipboard.writeText(url);
    toast.success("Image link copied to clipboard! 🔗");
  }

  // Action: WhatsApp share
  async function handleWhatsAppShare() {
    if (!wrappedData || !aiSummary) return;
    const url = await triggerExport(selectedTheme);
    const shareText = `✨ Our PokeUs Week Wrapped ✨\n\n"${aiSummary.subtitle}"\n\nCheck out our relationship story here: ${url || "PokeUs App"} 💜`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
  }

  // Action: Instagram Story Share instructions
  async function handleInstagramShare() {
    toast.info("Downloading high-res story template... Save it to your gallery and share on Instagram! 📸", {
      duration: 5000,
    });
    await handleDownload();
  }

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
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/40 p-2 shadow-2xl">
          <WrappedContainer
            data={wrappedData}
            aiSummary={aiSummary}
            theme={selectedTheme}
            isExportMode={false}
          />
          
          {isExporting && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={40} className="text-pink-400" />
              </motion.div>
              <p className="text-md font-bold text-white">Exporting high-resolution PNG...</p>
              <p className="text-xs text-[#B0A5D0]">Playwright rendering card at 1080x1920</p>
            </div>
          )}
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

        {/* Action sharing grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleInstagramShare}
            disabled={isExporting}
            className="py-4 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            <ImageIcon size={16} />
            Instagram Story
          </button>
          <button
            onClick={handleWhatsAppShare}
            disabled={isExporting}
            className="py-4 px-4 bg-[#25D366] hover:bg-[#20ba56] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send size={16} />
            WhatsApp Share
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="py-4 px-4 bg-slate-900 border border-white/10 rounded-2xl text-sm font-semibold text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Download size={16} />
            Download PNG
          </button>
          <button
            onClick={handleCopyLink}
            disabled={isExporting}
            className="py-4 px-4 bg-slate-900 border border-white/10 rounded-2xl text-sm font-semibold text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Copy size={16} />
            Copy Image URL
          </button>
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
