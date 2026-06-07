"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Plus, BookOpen, Lock, Unlock, Trash2, X, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/frontend/store";
import { getInitials } from "@/backend/lib/utils";

const MOODS = ["😊","😍","🥰","😌","😔","😤","🥺","😭","🤩","😴"];

export default function JournalPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadEntries(p = 1) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/journal?page=${p}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries);
        setTotalPages(data.pages);
        setPage(p);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadEntries(); }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    setIsSaving(true);
    const saving = toast.loading("Saving entry...");
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, mood: mood || undefined, photoUrl: photoUrl || undefined, isPrivate }),
      });
      const data = await res.json();
      toast.dismiss(saving);
      if (res.ok) {
        setEntries([data.entry, ...entries]);
        setShowAdd(false);
        setTitle(""); setContent(""); setMood(""); setPhotoUrl(null); setIsPrivate(false);
        toast.success("Entry saved 📝");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch { toast.dismiss(saving); toast.error("Something went wrong"); }
    finally { setIsSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/journal/${id}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e.id !== id));
      setSelected(null);
      toast.success("Entry deleted");
    } catch { toast.error("Something went wrong"); }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Our Journal</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Shared stories & moments</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Write
          </button>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="card p-4 h-24 skeleton" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📖</span>
            <h3 className="font-bold text-lg mb-2">Your journal is empty</h3>
            <p className="text-sm mb-5" style={{ color: "rgb(var(--text-muted))" }}>Write your first shared memory</p>
            <button onClick={() => setShowAdd(true)} className="btn-brand py-3 px-8">Write First Entry</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelected(entry)}
                  className="card p-4 cursor-pointer hover:border-brand-400/30 transition-all"
                >
                  {entry.photoUrl && (
                    <div className="h-32 rounded-xl overflow-hidden mb-3 -mx-1">
                      <img src={entry.photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.mood && <span className="text-base">{entry.mood}</span>}
                        <p className="font-semibold text-sm truncate">{entry.title}</p>
                        {entry.isPrivate && <Lock size={12} style={{ color: "rgb(var(--text-subtle))", flexShrink: 0 }} />}
                      </div>
                      <p className="text-xs line-clamp-2" style={{ color: "rgb(var(--text-muted))" }}>{entry.content}</p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {entry.createdBy?.avatar
                          ? <img src={entry.createdBy.avatar} className="w-full h-full object-cover" />
                          : getInitials(entry.createdBy?.name || "U")}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "rgb(var(--text-subtle))" }}>
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => loadEntries(page - 1)} disabled={page === 1} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgb(var(--surface-muted))" }}>
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{page} / {totalPages}</span>
                <button onClick={() => loadEntries(page + 1)} disabled={page === totalPages} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgb(var(--surface-muted))" }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ background: "rgb(var(--surface))" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selected.mood && <span className="text-2xl">{selected.mood}</span>}
                  <h2 className="font-display font-bold text-xl">{selected.title}</h2>
                </div>
                <div className="flex gap-2">
                  {selected.createdBy?.id === user?.id && (
                    <button onClick={() => handleDelete(selected.id)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                      <Trash2 size={16} style={{ color: "#ef4444" }} />
                    </button>
                  )}
                  <button onClick={() => setSelected(null)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
                </div>
              </div>
              {selected.photoUrl && <img src={selected.photoUrl} alt="" className="w-full rounded-2xl object-cover max-h-48" />}
              <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>{selected.content}</p>
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgb(var(--border))" }}>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {selected.createdBy?.avatar ? <img src={selected.createdBy.avatar} className="w-full h-full object-cover" /> : getInitials(selected.createdBy?.name || "U")}
                </div>
                <div>
                  <p className="text-xs font-semibold">{selected.createdBy?.name}</p>
                  <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>
                    {new Date(selected.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </p>
                </div>
                {selected.isPrivate && <Lock size={12} style={{ color: "rgb(var(--text-subtle))", marginLeft: "auto" }} />}
              </div>
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
                <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>New Entry</h2>
                <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
              </div>

              {/* Photo */}
              <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={handleImageSelect} />
              {photoUrl ? (
                <div className="relative h-36 rounded-2xl overflow-hidden">
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotoUrl(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: "rgb(var(--border))" }}>
                  <ImageIcon size={22} style={{ color: "rgb(var(--text-subtle))" }} />
                  <span className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Add a photo</span>
                </button>
              )}

              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Entry title" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} className="input-field resize-none" rows={5} placeholder="Write your thoughts..." />

              {/* Mood */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "rgb(var(--text-muted))" }}>How are you feeling?</p>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((m) => (
                    <button key={m} onClick={() => setMood(mood === m ? "" : m)} className="text-2xl transition-all" style={{ opacity: mood && mood !== m ? 0.4 : 1, transform: mood === m ? "scale(1.3)" : "scale(1)" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgb(var(--surface-muted))" }}>
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock size={16} style={{ color: "#d946ef" }} /> : <Unlock size={16} style={{ color: "rgb(var(--text-muted))" }} />}
                  <span className="text-sm font-medium">Private entry</span>
                </div>
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="relative w-11 h-6 rounded-full transition-all"
                  style={{ background: isPrivate ? "linear-gradient(135deg, #d946ef, #e11d48)" : "rgb(var(--surface-subtle))" }}
                >
                  <motion.div animate={{ x: isPrivate ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <button onClick={handleSave} disabled={isSaving || !title.trim() || !content.trim()} className="btn-brand w-full justify-center py-3">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><BookOpen size={16} /> Save Entry</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
