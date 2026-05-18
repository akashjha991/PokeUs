"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, StickyNote, Check, X, Pin } from "lucide-react";

const NOTE_COLORS = ["#d946ef", "#e11d48", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

const MOCK_NOTES: any[] = [];

const MOCK_TODOS: any[] = [];

export default function NotesPage() {
  const [todos, setTodos] = useState(MOCK_TODOS);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "todos">("notes");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [newTodo, setNewTodo] = useState("");

  function toggleTodo(id: string) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, isDone: !t.isDone } : t));
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-5" style={{ color: "rgb(var(--text))" }}>
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

        {/* NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            {MOCK_NOTES.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4 border"
                style={{ borderColor: `${note.color}30`, background: `${note.color}08` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm">{note.title}</h3>
                  {note.isPinned && <Pin size={13} style={{ color: note.color, flexShrink: 0 }} />}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>{note.content}</p>
              </motion.div>
            ))}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTodo.trim()) {
                    setTodos((p) => [...p, { id: Date.now().toString(), title: newTodo.trim(), isDone: false }]);
                    setNewTodo("");
                  }
                }}
              />
            </div>
            {todos.map((todo, i) => (
              <motion.button
                key={todo.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleTodo(todo.id)}
                className="card w-full flex items-center gap-3 p-4 text-left transition-all active:scale-[0.98]"
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
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ADD NOTE MODAL */}
      {showAdd && activeTab === "notes" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="w-full max-w-md rounded-t-3xl p-6 space-y-4"
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
            <button className="btn-brand w-full justify-center py-3">
              <StickyNote size={16} /> Save Note
            </button>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
