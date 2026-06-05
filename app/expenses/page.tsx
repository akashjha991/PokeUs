"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, DollarSign, Trash2, X, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/backend/lib/utils";
import { useAuthStore } from "@/frontend/store";

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  FOOD: { emoji: "🍕", color: "#f59e0b" },
  TRAVEL: { emoji: "✈️", color: "#3b82f6" },
  ENTERTAINMENT: { emoji: "🎬", color: "#8b5cf6" },
  SHOPPING: { emoji: "🛍️", color: "#e11d48" },
  HEALTH: { emoji: "💊", color: "#10b981" },
  UTILITIES: { emoji: "💡", color: "#f97316" },
  OTHER: { emoji: "📦", color: "#6b7280" },
};

const MOCK_EXPENSES: any[] = [];

const CHART_DATA: any[] = [];

const CATEGORIES = ["FOOD", "TRAVEL", "ENTERTAINMENT", "SHOPPING", "HEALTH", "UTILITIES", "OTHER"];

export default function ExpensesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("FOOD");

  const total = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const myShare = total / 2;

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">Expenses</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Shared spending tracker</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand py-2 px-4 text-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: "rgb(var(--text-muted))" }}>Total Spent</p>
            <p className="font-display font-bold text-xl gradient-text">{formatCurrency(total)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: "rgb(var(--text-muted))" }}>Your Share</p>
            <p className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>{formatCurrency(myShare)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={15} style={{ color: "rgb(217,70,239)" }} /> Monthly Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={CHART_DATA} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: "12px", fontSize: 12, color: "rgb(var(--text))" }}
                cursor={{ fill: "rgba(217,70,239,0.05)" }}
                formatter={(v: number) => [formatCurrency(v), "Spent"]}
              />
              <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense List */}
        <div className="space-y-2">
          {MOCK_EXPENSES.map((expense, i) => {
            const cfg = CATEGORY_CONFIG[expense.category];
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card flex items-center gap-3 p-4"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${cfg.color}20` }}>
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{expense.title}</p>
                  <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                    Paid by {expense.paidBy.name} · Split equally
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>each {formatCurrency(expense.amount / 2)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAdd && (
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
              <h2 className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>Add Expense</h2>
              <button onClick={() => setShowAdd(false)}><X size={22} style={{ color: "rgb(var(--text-muted))" }} /></button>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="What did you spend on?" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: "rgb(var(--text-muted))" }}>₹</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="input-field pl-8" placeholder="0.00" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                    style={{
                      borderColor: category === cat ? cfg.color : "rgb(var(--border))",
                      background: category === cat ? `${cfg.color}20` : "transparent",
                    }}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className="text-xs" style={{ color: category === cat ? cfg.color : "rgb(var(--text-muted))" }}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            <button className="btn-brand w-full justify-center py-3">
              <DollarSign size={16} /> Save Expense
            </button>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
