"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart } from "lucide-react";

export function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden"
      style={{ background: "rgb(var(--bg))" }}>
      {/* Background glows */}
      <div className="hero-glow w-80 h-80 bg-brand-500 -top-20 -left-20" />
      <div className="hero-glow w-60 h-60 bg-rose-500 -bottom-10 -right-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: "rgb(var(--text))" }}>
            Poke<span className="gradient-text">Us</span>
          </span>
        </Link>

        <div className="glass-card p-6 shadow-glass">
          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: "rgb(var(--text))" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mb-6" style={{ color: "rgb(var(--text-muted))" }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
