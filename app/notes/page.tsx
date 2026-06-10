"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, StickyNote, Check, X, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";

const NOTE_COLORS = ["#d946ef", "#e11d48", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "todos">("notes");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [notesRes, todosRes] = await Promise.all([
          fetch("/api/notes"),
          fetch("/api/todos"),
        ]);
        const notesData = await notesRes.json();
        const todosData = await todosRes.json();
        if (notesRes.ok && notesData.notes) setNotes(notesData.notes);
        if (todosRes.ok && todosData.todos) setTodos(todosData.todos);
      } catch (error) {
        console.error("Failed to load notes/todos:", error);
        toast.error("Failed to load notes and to-dos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleAddNote() {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          color: selectedColor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => [data.note, ...prev]);
        setNoteTitle("");
        setNoteContent("");
        setShowAdd(false);
        toast.success("Note saved! 📝");
      } else {
        toast.error(data.error || "Failed to save note");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        toast.success("Note deleted");
      } else {
        toast.error("Failed to delete note");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleTogglePin(id: string, currentPin: boolean) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPin }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) =>
          prev
            .map((n) => (n.id === id ? data.note : n))
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
        );
        toast.success(currentPin ? "Note unpinned" : "Note pinned 📌");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleAddTodo(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && newTodo.trim()) {
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTodo }),
        });
        const data = await res.json();
        if (res.ok) {
          setTodos((prev) => [data.todo, ...prev]);
          setNewTodo("");
          toast.success("To-do item added!");
        } else {
          toast.error(data.error || "Failed to add to-do");
        }
      } catch {
        toast.error("Something went wrong");
      }
    }
  }

  async function handleToggleTodo(id: string, currentDone: boolean) {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !currentDone }),
      });
      const data = await res.json();
      if (res.ok) {
        setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)));
      } else {
        toast.error("Failed to update to-do");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteTodo(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        toast.success("To-do deleted");
      } else {
        toast.error("Failed to delete to-do");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Notes & Lists</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Your shared space</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgb(var(--surface-muted))" }}>
          {(["notes", "todos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? "rgb(var(--surface))" : "transparent",
                color: activeTab === tab ? "rgb(var(--text))" : "rgb(var(--text-muted))",
                boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {tab === "notes" ? "📝 Notes" : "✅ To-Do"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgb(var(--brand))", borderTopColor: "transparent" }}></div>
          </div>
        ) : (
          <>
            {/* NOTES */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="card p-8 text-center" style={{ color: "rgb(var(--text-muted))" }}>
                    <StickyNote size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No notes yet</p>
                    <p className="text-xs">Create one to leave a message for your partner.</p>
                  </div>
                ) : (
                  notes.map((note, i) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-2xl p-4 border relative group"
                      style={{ borderColor: `${note.color}30`, background: `${note.color}08` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{note.title}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePin(note.id, note.isPinned)}
                            className="p-1 hover:bg-black/5 rounded transition-all"
                          >
                            <Pin
                              size={13}
                              style={{
                                color: note.isPinned ? note.color : "rgb(var(--text-muted))",
                                fill: note.isPinned ? note.color : "none",
                              }}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-red-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>{note.content}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TODOS */}
            {activeTab === "todos" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Add a to-do..."
                    onKeyDown={handleAddTodo}
                  />
                </div>
                {todos.length === 0 ? (
                  <div className="card p-8 text-center" style={{ color: "rgb(var(--text-muted))" }}>
                    <Check size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs">No active items on your list.</p>
                  </div>
                ) : (
                  todos.map((todo, i) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card w-full flex items-center justify-between p-4"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo.id, todo.isDone)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        <div
                          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: todo.isDone ? "rgb(217,70,239)" : "rgb(var(--border))",
                            background: todo.isDone ? "rgb(217,70,239)" : "transparent",
                          }}
                        >
                          {todo.isDone && <Check size={13} className="text-white" />}
                        </div>
                        <span
                          className="text-sm flex-1"
                          style={{
                            color: todo.isDone ? "rgb(var(--text-subtle))" : "rgb(var(--text))",
                            textDecoration: todo.isDone ? "line-through" : "none",
                          }}
                        >
                          {todo.title}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-1 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD NOTE MODAL */}
      {showAdd && activeTab === "notes" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)", paddingBottom: "5rem" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="w-full max-w-md rounded-3xl mx-4 mb-4 p-6 space-y-4 shadow-2xl"
            style={{ background: "rgb(var(--surface))" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>New Note</h2>
              <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
            </div>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: selectedColor === c ? "white" : "transparent", transform: selectedColor === c ? "scale(1.2)" : "scale(1)" }}
                />
              ))}
            </div>
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="input-field" placeholder="Note title" />
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="input-field resize-none" rows={4} placeholder="Write your note..." />
            <button onClick={handleAddNote} className="btn-brand w-full justify-center py-3">
              <StickyNote size={16} /> Save Note
            </button>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
