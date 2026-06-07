"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Trophy, Check, Trash2, X, Target, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/backend/lib/utils";

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  ADVENTURE: { emoji: "🏔️", color: "#f59e0b", label: "Adventure" },
  TRAVEL:    { emoji: "✈️", color: "#3b82f6", label: "Travel" },
  FOOD:      { emoji: "🍜", color: "#e11d48", label: "Food" },
  HEALTH:    { emoji: "💪", color: "#10b981", label: "Health" },
  RELATIONSHIP: { emoji: "💜", color: "#d946ef", label: "Relationship" },
  LEARNING:  { emoji: "📚", color: "#8b5cf6", label: "Learning" },
  OTHER:     { emoji: "🎯", color: "#6b7280", label: "Other" },
};

const EMOJIS = ["🎯","🌊","🏔️","✈️","🍜","💜","🎨","📚","🌸","🏕️","🎭","🌍"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all"|"pending"|"done">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ADVENTURE");
  const [emoji, setEmoji] = useState("🎯");
  const [targetDate, setTargetDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d) => { if (d.goals) setGoals(d.goals); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleAdd() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, emoji, targetDate: targetDate || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals([data.goal, ...goals]);
        setShowAdd(false);
        setTitle(""); setDescription(""); setTargetDate("");
        toast.success("Goal added! 🎯");
      } else {
        toast.error(data.error || "Failed to add goal");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setIsSaving(false); }
  }

  async function toggleComplete(goal: any) {
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !goal.isCompleted }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals(goals.map((g) => g.id === goal.id ? data.goal : g));
        toast.success(data.goal.isCompleted ? "Goal completed! 🎉" : "Marked as pending");
      }
    } catch { toast.error("Something went wrong"); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      setGoals(goals.filter((g) => g.id !== id));
      toast.success("Goal removed");
    } catch { toast.error("Something went wrong"); }
  }

  const filtered = goals.filter((g) =>
    activeFilter === "all" ? true : activeFilter === "done" ? g.isCompleted : !g.isCompleted
  );
  const completedCount = goals.filter((g) => g.isCompleted).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Bucket List</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Dreams to chase together</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Progress */}
        {goals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={16} style={{ color: "#f59e0b" }} />
                <span className="text-sm font-semibold">{completedCount} of {goals.length} completed</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#d946ef" }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgb(var(--surface-muted))" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #d946ef, #e11d48)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgb(var(--surface-muted))" }}>
          {(["all","pending","done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: activeFilter === f ? "rgb(var(--surface))" : "transparent",
                color: activeFilter === f ? "rgb(var(--text))" : "rgb(var(--text-muted))",
                boxShadow: activeFilter === f ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {f === "all" ? "All Goals" : f === "done" ? "✅ Done" : "⏳ Pending"}
            </button>
          ))}
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 skeleton rounded" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🎯</span>
            <h3 className="font-bold text-lg mb-2">
              {activeFilter === "done" ? "No completed goals yet" : "No goals yet"}
            </h3>
            <p className="text-sm mb-5" style={{ color: "rgb(var(--text-muted))" }}>
              Add your first dream together
            </p>
            {activeFilter !== "done" && (
              <button onClick={() => setShowAdd(true)} className="btn-brand py-3 px-8">Add First Goal</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((goal, i) => {
                const cfg = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.OTHER;
                return (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.06 }}
                    className="card p-4 flex items-center gap-3"
                    style={{ opacity: goal.isCompleted ? 0.75 : 1 }}
                  >
                    {/* Emoji badge */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}30` }}
                    >
                      {goal.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${goal.isCompleted ? "line-through" : ""}`}>{goal.title}</p>
                      <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{cfg.label}</p>
                      {goal.targetDate && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar size={10} style={{ color: "rgb(var(--text-subtle))" }} />
                          <span className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>
                            {formatDate(goal.targetDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleComplete(goal)}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: goal.isCompleted ? "#10b981" : "rgb(var(--border))",
                          background: goal.isCompleted ? "#10b981" : "transparent",
                        }}
                      >
                        {goal.isCompleted && <Check size={14} className="text-white" />}
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="w-8 h-8 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-all">
                        <Trash2 size={14} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

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
              className="w-full max-w-md rounded-3xl mx-4 mb-4 p-6 space-y-4 shadow-2xl"
              style={{ background: "rgb(var(--surface))" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>New Goal</h2>
                <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
              </div>

              {/* Emoji picker */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "rgb(var(--text-muted))" }}>Pick an emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ background: emoji === e ? "rgba(217,70,239,0.2)" : "rgb(var(--surface-muted))", border: emoji === e ? "2px solid #d946ef" : "2px solid transparent" }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Goal title (e.g. Visit Paris together)" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Description (optional)" />

              {/* Category */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all"
                    style={{
                      borderColor: category === key ? cfg.color : "rgb(var(--border))",
                      background: category === key ? `${cfg.color}15` : "transparent",
                    }}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className="text-xs" style={{ color: category === key ? cfg.color : "rgb(var(--text-muted))" }}>{cfg.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "rgb(var(--text-muted))" }}>Target date (optional)</label>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input-field" />
              </div>

              <button onClick={handleAdd} disabled={isSaving || !title.trim()} className="btn-brand w-full justify-center py-3">
                <Target size={16} /> {isSaving ? "Saving..." : "Add Goal"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
