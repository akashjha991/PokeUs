"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Plus, Lock, X, Image as ImageIcon, Loader2, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/frontend/store";
import { getInitials } from "@/backend/lib/utils";
import { differenceInDays, differenceInHours, format } from "date-fns";

function CountdownBadge({ revealDate }: { revealDate: string }) {
  const now = new Date();
  const reveal = new Date(revealDate);
  const days = differenceInDays(reveal, now);
  const hours = differenceInHours(reveal, now);

  if (days > 0) return <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>🔒 Opens in {days}d</span>;
  if (hours > 0) return <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>🔒 Opens in {hours}h</span>;
  return <span className="text-xs font-semibold" style={{ color: "#10b981" }}>✅ Now open!</span>;
}

export default function CapsulePage() {
  const { user } = useAuthStore();
  const [capsules, setCapsules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [revealDate, setRevealDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/capsule")
      .then((r) => r.json())
      .then((d) => { if (d.capsules) setCapsules(d.capsules); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!title.trim() || !message.trim() || !revealDate) {
      toast.error("All fields are required");
      return;
    }
    if (new Date(revealDate) <= new Date()) {
      toast.error("Reveal date must be in the future");
      return;
    }
    setIsSaving(true);
    const saving = toast.loading("Sealing capsule...");
    try {
      const res = await fetch("/api/capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, revealDate, photoUrl: photoUrl || undefined }),
      });
      const data = await res.json();
      toast.dismiss(saving);
      if (res.ok) {
        setCapsules([data.capsule, ...capsules]);
        setShowAdd(false);
        setTitle(""); setMessage(""); setRevealDate(""); setPhotoUrl(null);
        toast.success("Time capsule sealed! 🕰️");
      } else {
        toast.error(data.error || "Failed to seal capsule");
      }
    } catch { toast.dismiss(saving); toast.error("Something went wrong"); }
    finally { setIsSaving(false); }
  }

  // Minimum date: tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Time Capsules</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Messages from your past selves</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Seal
          </button>
        </div>

        {/* Explainer */}
        <div className="card p-4 flex items-start gap-3" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
          <span className="text-2xl flex-shrink-0">🕰️</span>
          <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
            Seal a message to your future selves. It stays locked until the reveal date — not even you can read it early.
          </p>
        </div>

        {/* Capsules */}
        {isLoading ? (
          <div className="space-y-3">{[1,2].map((i) => <div key={i} className="card h-24 skeleton" />)}</div>
        ) : capsules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🕰️</span>
            <h3 className="font-bold text-lg mb-2">No capsules yet</h3>
            <p className="text-sm mb-5" style={{ color: "rgb(var(--text-muted))" }}>Seal your first message to the future</p>
            <button onClick={() => setShowAdd(true)} className="btn-brand py-3 px-8">Create Capsule</button>
          </div>
        ) : (
          <div className="space-y-3">
            {capsules.map((capsule, i) => {
              const isOpen = capsule.isRevealed || new Date(capsule.revealDate) <= new Date();
              return (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => isOpen && setSelected(capsule)}
                  className="card p-4 flex items-center gap-4"
                  style={{ cursor: isOpen ? "pointer" : "default", opacity: isOpen ? 1 : 0.9 }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: isOpen ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.1)" }}
                  >
                    {isOpen ? "📬" : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{isOpen ? capsule.title : "???"}</p>
                    <p className="text-xs mb-1" style={{ color: "rgb(var(--text-muted))" }}>
                      {isOpen ? `Sealed ${format(new Date(capsule.createdAt), "d MMM yyyy")}` : "Sealed message"}
                    </p>
                    <CountdownBadge revealDate={capsule.revealDate} />
                  </div>
                  {isOpen && <Eye size={18} style={{ color: "rgb(var(--text-subtle))" }} />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* REVEAL MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ y: 100, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ background: "rgb(var(--surface))" }}
            >
              <div className="text-center pb-2">
                <span className="text-4xl">📬</span>
                <h2 className="font-display font-bold text-xl mt-2">{selected.title}</h2>
                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                  Sealed {format(new Date(selected.createdAt), "d MMMM yyyy")} · Opened {format(new Date(selected.revealDate), "d MMMM yyyy")}
                </p>
              </div>
              {selected.photoUrl && <img src={selected.photoUrl} alt="" className="w-full rounded-2xl object-cover max-h-48" />}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text))" }}>{selected.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {selected.createdBy?.avatar ? <img src={selected.createdBy.avatar} className="w-full h-full object-cover" /> : getInitials(selected.createdBy?.name || "U")}
                </div>
                <span className="text-xs font-semibold">{selected.createdBy?.name}</span>
              </div>
              <button onClick={() => setSelected(null)} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "rgb(var(--surface-muted))" }}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.6)", paddingBottom: "5rem" }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-md rounded-3xl mx-4 mb-4 p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: "rgb(var(--surface))" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>Seal a Capsule</h2>
                <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={handleImageSelect} />
              {photoUrl ? (
                <div className="relative h-36 rounded-2xl overflow-hidden">
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotoUrl(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1" style={{ borderColor: "rgb(var(--border))" }}>
                  <ImageIcon size={22} style={{ color: "rgb(var(--text-subtle))" }} />
                  <span className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Add a photo (optional)</span>
                </button>
              )}
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Capsule title" />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field resize-none" rows={5} placeholder="Write a message to your future selves..." />
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "rgb(var(--text-muted))" }}>Reveal date</label>
                <input type="date" min={minDateStr} value={revealDate} onChange={(e) => setRevealDate(e.target.value)} className="input-field" />
              </div>
              <button onClick={handleSave} disabled={isSaving || !title.trim() || !message.trim() || !revealDate} className="btn-brand w-full justify-center py-3">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Lock size={16} /> Seal Capsule</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
