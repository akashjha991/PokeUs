"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Plus, Camera, Calendar, X, Heart, Loader2, Grid, Clock } from "lucide-react";
import { formatDate } from "@/backend/lib/utils";
import { toast } from "sonner";

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "gallery">("timeline");
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);
  
  // New memory state
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchMemories() {
      try {
        const res = await fetch("/api/memories");
        const data = await res.json();
        if (res.ok && data.memories) {
          setMemories(data.memories);
        }
      } catch (err) {
        console.error("Failed to load memories", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMemories();
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveMemory() {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caption, photoUrl })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMemories([data.memory, ...memories]);
        // Reset form
        setTitle("");
        setCaption("");
        setPhotoUrl(null);
        setShowAdd(false);
        toast.success("Memory saved successfully! 💜");
      } else {
        toast.error(data.error || "Failed to save memory");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  // Filter out memories that actually have photos
  const photoMemories = memories.filter((m) => m.photos && m.photos[0]?.url);

  // Dynamic tile styles for Windows Feed Gallery style tiles
  const getGridStyle = (index: number) => {
    const mod = index % 5;
    if (mod === 0) return "col-span-2 row-span-2 h-64";
    if (mod === 1) return "col-span-1 row-span-1 h-[7.5rem]";
    if (mod === 2) return "col-span-1 row-span-1 h-[7.5rem]";
    if (mod === 3) return "col-span-1 row-span-2 h-64";
    return "col-span-2 row-span-1 h-[7.5rem]";
  };

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">Memories</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Your shared love story 💜</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm shadow-brand hover:scale-105 transition-transform">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Tab Toggle for Mobile */}
        <div className="flex md:hidden rounded-2xl p-1 mb-5" style={{ background: "rgb(var(--surface-muted))" }}>
          <button
            onClick={() => setActiveTab("timeline")}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === "timeline" ? "rgb(var(--surface))" : "transparent",
              color: activeTab === "timeline" ? "rgb(var(--text))" : "rgb(var(--text-muted))",
              boxShadow: activeTab === "timeline" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}
          >
            <Clock size={13} /> Timestamp Feed
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === "gallery" ? "rgb(var(--surface))" : "transparent",
              color: activeTab === "gallery" ? "rgb(var(--text))" : "rgb(var(--text-muted))",
              boxShadow: activeTab === "gallery" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}
          >
            <Grid size={13} /> Feed Gallery
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Zone Skeleton: Timeline Cards */}
            <div className={`md:col-span-6 space-y-6 ${activeTab === "timeline" ? "block" : "hidden md:block"}`}>
              <h2 className="hidden md:flex items-center gap-2 font-display font-bold text-base mb-4 text-zinc-500 animate-pulse">
                <Clock size={16} /> Loading Feed...
              </h2>
              <div className="relative pl-8">
                <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-zinc-800 animate-pulse" />
                <div className="space-y-6">
                  {[1, 2, 3].map((idx) => (
                    <div key={`timeline-skel-${idx}`} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-8 top-4 w-4 h-4 rounded-full bg-zinc-800 animate-pulse" />
                      
                      <div className="card overflow-hidden bg-zinc-900 border border-zinc-800/50">
                        <div className="relative h-44 bg-zinc-850 animate-pulse" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 w-1/3 bg-zinc-800 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-zinc-800/60 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Zone Skeleton: Windows Feed Collage Gallery */}
            <div className={`md:col-span-6 ${activeTab === "gallery" ? "block" : "hidden md:block"}`}>
              <h2 className="hidden md:flex items-center gap-2 font-display font-bold text-base mb-4 text-zinc-500 animate-pulse">
                <Grid size={16} /> Loading Gallery...
              </h2>
              <div className="grid grid-cols-3 gap-2 auto-rows-max">
                {[
                  "col-span-2 row-span-2 h-64",
                  "col-span-1 row-span-1 h-[7.5rem]",
                  "col-span-1 row-span-1 h-[7.5rem]",
                  "col-span-1 row-span-2 h-64",
                  "col-span-2 row-span-1 h-[7.5rem]",
                ].map((className, idx) => (
                  <div
                    key={`gallery-skel-${idx}`}
                    className={`${className} rounded-2xl bg-zinc-850 animate-pulse`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📸</span>
            <h3 className="font-bold text-lg mb-2">No Memories Yet</h3>
            <p className="text-sm mb-5" style={{ color: "rgb(var(--text-muted))" }}>Start capturing your beautiful moments together</p>
            <button onClick={() => setShowAdd(true)} className="btn-brand py-3 px-8 shadow-brand">Add First Memory</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Zone: Timestamped Images & Cards */}
            <div className={`md:col-span-6 space-y-6 ${activeTab === "timeline" ? "block" : "hidden md:block"}`}>
              <h2 className="hidden md:flex items-center gap-2 font-display font-bold text-base mb-4" style={{ color: "rgb(var(--text-muted))" }}>
                <Clock size={16} /> Timestamp Feed
              </h2>
              <div className="relative pl-8">
                <div className="absolute left-[7px] top-4 bottom-4 w-0.5" style={{ background: "rgba(217,70,239,0.15)" }} />
                <div className="space-y-6">
                  {memories.map((memory, i) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative cursor-pointer group"
                      onClick={() => setSelectedMemory(memory)}
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-8 top-4 w-4 h-4 rounded-full border-2 border-brand-500 bg-brand-500/20 group-hover:scale-125 transition-transform" />

                      <div className="card overflow-hidden hover:shadow-lg transition-shadow border border-transparent hover:border-brand-500/30">
                        {memory.photos && memory.photos[0] && (
                          <div className="relative h-44 overflow-hidden">
                            <img src={memory.photos[0].url} alt={memory.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4">
                              <p className="text-white font-display font-bold text-base leading-snug">{memory.title}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Calendar size={11} className="text-white/70" />
                                <p className="text-white/70 text-xs">{formatDate(memory.date)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {(!memory.photos || memory.photos.length === 0) && (
                          <div className="p-4 pb-0">
                            <p className="font-display font-bold text-base mb-1">{memory.title}</p>
                            <div className="flex items-center gap-1 mb-2">
                              <Calendar size={11} style={{ color: "rgb(var(--text-subtle))" }} />
                              <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>{formatDate(memory.date)}</p>
                            </div>
                          </div>
                        )}
                        {memory.caption && (
                          <div className="p-4 pt-3">
                            <p className="text-sm line-clamp-2" style={{ color: "rgb(var(--text-muted))" }}>{memory.caption}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Zone: Windows Feed Gallery */}
            <div className={`md:col-span-6 ${activeTab === "gallery" ? "block" : "hidden md:block"}`}>
              <h2 className="hidden md:flex items-center gap-2 font-display font-bold text-base mb-4" style={{ color: "rgb(var(--text-muted))" }}>
                <Grid size={16} /> Windows Feed Gallery
              </h2>
              {photoMemories.length === 0 ? (
                <div className="card p-8 text-center" style={{ color: "rgb(var(--text-muted))" }}>
                  <p className="text-sm">No photo memories uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 auto-rows-max">
                  {photoMemories.map((memory, i) => {
                    const tileClass = getGridStyle(i);
                    return (
                      <motion.div
                        key={`gallery-${memory.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${tileClass} relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm`}
                        onClick={() => setSelectedMemory(memory)}
                      >
                        <img
                          src={memory.photos[0].url}
                          alt={memory.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute bottom-2 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-xs font-bold truncate">{memory.title}</p>
                          <p className="text-[10px] text-white/70">{formatDate(memory.date)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl rounded-3xl overflow-hidden bg-zinc-900 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Photo Area */}
              {selectedMemory.photos && selectedMemory.photos[0] && (
                <div className="w-full max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedMemory.photos[0].url}
                    alt={selectedMemory.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Description Area */}
              <div className="p-6 text-white space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display font-bold text-xl">{selectedMemory.title}</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
                    <Calendar size={12} />
                    <span>{formatDate(selectedMemory.date)}</span>
                  </div>
                </div>
                {selectedMemory.caption && (
                  <p className="text-sm leading-relaxed text-zinc-300">{selectedMemory.caption}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD MEMORY MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.6)", paddingBottom: "5rem" }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md rounded-3xl mx-4 mb-4 p-6 space-y-4 shadow-2xl"
              style={{ background: "rgb(var(--surface))" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>New Memory</h2>
                <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-2xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative"
                style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--text-muted))" }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={28} />
                    <p className="text-sm">Tap to add photos</p>
                  </>
                )}
              </div>
              
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Memory title (required)" />
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="input-field resize-none" rows={3} placeholder="Add a caption..." />
              
              <button 
                onClick={handleSaveMemory} 
                disabled={!title.trim() || isSaving}
                className="btn-brand w-full justify-center py-3 shadow-brand"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Heart size={16} /> Save Memory</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
