"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, X, Heart, Calendar as CalIcon, Star, Plane, Flag, Gift } from "lucide-react";
import { formatDate } from "@/backend/lib/utils";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  ANNIVERSARY: <Heart size={16} className="text-rose-400 fill-rose-400" />,
  BIRTHDAY: <Gift size={16} className="text-amber-400" />,
  DATE: <Star size={16} className="text-brand-400" />,
  TRIP: <Plane size={16} className="text-blue-400" />,
  MILESTONE: <Flag size={16} className="text-emerald-400" />,
  OTHER: <CalIcon size={16} style={{ color: "rgb(var(--text-muted))" }} />,
};

const EVENT_COLORS: Record<string, string> = {
  ANNIVERSARY: "#e11d48",
  BIRTHDAY: "#f59e0b",
  DATE: "#d946ef",
  TRIP: "#3b82f6",
  MILESTONE: "#10b981",
  OTHER: "#6b7280",
};

const MOCK_EVENTS: any[] = [];

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function CalendarPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("DATE");

  const sorted = [...MOCK_EVENTS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Calendar</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Special dates & reminders</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-3">
          {sorted.map((event, i) => {
            const days = getDaysUntil(event.date);
            const color = EVENT_COLORS[event.eventType];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  {EVENT_ICONS[event.eventType]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{event.title}</p>
                  <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{formatDate(event.date)}</p>
                  {event.isRecurring && (
                    <span className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>↺ Recurring yearly</span>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {days > 0 ? (
                    <>
                      <p className="font-bold text-lg" style={{ color }}>{days}</p>
                      <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>days left</p>
                    </>
                  ) : days === 0 ? (
                    <span className="badge-pill text-xs" style={{ background: `${color}20`, color, borderColor: `${color}30` }}>Today! 🎉</span>
                  ) : (
                    <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Past</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      {showAdd && (
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
              <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>New Event</h2>
              <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Event title" />
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="input-field" />
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(EVENT_ICONS).map((type) => (
                <button
                  key={type}
                  onClick={() => setEventType(type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border transition-all"
                  style={{
                    borderColor: eventType === type ? EVENT_COLORS[type] : "rgb(var(--border))",
                    background: eventType === type ? `${EVENT_COLORS[type]}15` : "transparent",
                  }}
                >
                  {EVENT_ICONS[type]}
                  <span className="text-xs capitalize" style={{ color: eventType === type ? EVENT_COLORS[type] : "rgb(var(--text-muted))" }}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
            <button className="btn-brand w-full justify-center py-3">
              <CalIcon size={16} /> Save Event
            </button>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
