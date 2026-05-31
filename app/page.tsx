"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle, Image, Smile, DollarSign, Calendar, Zap, Shield, Sparkles, Star, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";

const FEATURES = [
  { icon: MessageCircle, title: "Real-Time Chat", desc: "Instant messaging with typing indicators, emoji reactions, and media sharing.", color: "#d946ef" },
  { icon: Image, title: "Shared Memories", desc: "Build your love story with an animated photo timeline and shared captions.", color: "#e11d48" },
  { icon: Smile, title: "Mood Check-In", desc: "Share how you're feeling daily and watch your mood patterns grow together.", color: "#f59e0b" },
  { icon: DollarSign, title: "Expense Tracker", desc: "Split bills effortlessly with shared expense tracking and analytics.", color: "#10b981" },
  { icon: Calendar, title: "Shared Calendar", desc: "Never miss an anniversary or special date with smart reminders.", color: "#3b82f6" },
  { icon: Zap, title: "Gamification", desc: "Earn XP, unlock badges, and level up your relationship together.", color: "#8b5cf6" },
];

const TESTIMONIALS = [
  { name: "Preeti & Akki", text: "PokeUs feels like our own little world. The chat and memories feature is absolutely beautiful!", avatar: "🥰" },
  { name: "Sarah & James", text: "We use the mood tracker every day. It's helped us understand each other so much better.", avatar: "💑" },
  { name: "Meera & Raj", text: "The expense tracker alone is worth it. No more arguments about money splits!", avatar: "💜" },
];

const FAQS = [
  { q: "Is my data private?", a: "Absolutely. Your couple space is end-to-end encrypted and completely private. No one else can see your chats or memories." },
  { q: "Can I use PokeUs on my phone?", a: "Yes! PokeUs is Android-first and works as a PWA — install it from your browser and use it like a native app." },
  { q: "Is PokeUs free?", a: "PokeUs offers a generous free tier with all core features. Premium features like custom themes and unlimited storage are available in Pro." },
  { q: "How do I invite my partner?", a: "Just enter their email after signing up. They'll receive a beautiful invite email to join your private space." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-5 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold" style={{ color: "rgb(var(--text))" }}>{q}</span>
        <ChevronDown size={18} className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "rgb(var(--text-muted))" }} />
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "rgb(var(--text-muted))" }}
        >
          {a}
        </motion.p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "rgb(var(--bg))", color: "rgb(var(--text))" }} className="min-h-screen overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-display font-bold text-lg">Poke<span className="gradient-text">Us</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-ghost text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-5 whitespace-nowrap">Sign In</Link>
            <Link href="/signup" className="btn-brand text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-5 whitespace-nowrap">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-20">
        <div className="hero-glow w-[500px] h-[500px] bg-brand-600 top-10 left-1/2 -translate-x-1/2" style={{ opacity: 0.2 }} />
        <div className="hero-glow w-72 h-72 bg-rose-600 bottom-20 left-10" style={{ opacity: 0.15 }} />
        <div className="hero-glow w-56 h-56 bg-brand-400 top-32 right-10" style={{ opacity: 0.1 }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="badge-pill mb-6 mx-auto w-fit">
            <Sparkles size={12} />
            <span>Built for couples who are serious about love</span>
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl leading-tight mb-6">
            Your{" "}
            <span className="gradient-text">Private</span>
            <br />
            Space for Two 💜
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
            Chat, share memories, track moods, and build your love story together — all in one beautifully designed private space.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-brand text-base py-4 px-8">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-ghost text-base py-4 px-8">
              Sign In
            </Link>
          </div>

          <p className="mt-5 text-xs" style={{ color: "rgb(var(--text-subtle))" }}>
            Free forever · No credit card needed · Installs like an app on Android
          </p>
        </motion.div>

        {/* HERO MOCKUP */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-16 max-w-sm w-full"
        >
          <div className="glass-card p-1 shadow-brand-lg animate-float">
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgb(var(--surface))" }}>
              <div className="p-4 border-b" style={{ borderColor: "rgb(var(--border))" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">A</div>
                  <div>
                    <p className="font-semibold text-sm">Arjun 💜</p>
                    <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>● Online now</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="bubble-in text-sm">Hey love! 😊 How was your day?</div>
                <div className="bubble-out text-sm">Amazing! Thinking of you all day 💜</div>
                <div className="bubble-in text-sm">Miss you so much! Can't wait to see you 🥺</div>
                <div className="flex items-center gap-2 mt-4">
                  <input readOnly className="input-field text-sm py-2" placeholder="Type a message..." />
                  <button className="btn-brand py-2 px-3 rounded-xl">→</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-5 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge-pill mb-4 mx-auto w-fit"><Star size={12} /> Everything you need</div>
            <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
              Made for <span className="gradient-text">Modern Couples</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgb(var(--text-muted))" }}>
              From daily check-ins to shared memories — every feature is crafted with love.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 group hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: "rgb(var(--text))" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-5" style={{ background: "rgb(var(--bg-secondary))" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-black text-4xl mb-3">Loved by <span className="gradient-text">Couples</span></h2>
            <p style={{ color: "rgb(var(--text-muted))" }}>Real stories from real couples using PokeUs every day.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6 shadow-glass">
                <p className="text-3xl mb-3">{t.avatar}</p>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: "rgb(var(--text-muted))" }}>"{t.text}"</p>
                <p className="font-semibold text-sm gradient-text">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-black text-4xl mb-3">FAQ</h2>
            <p style={{ color: "rgb(var(--text-muted))" }}>Got questions? We have answers.</p>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((f, i) => <FAQ key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="hero-glow w-96 h-96 bg-brand-500 top-0 left-1/2 -translate-x-1/2" style={{ opacity: 0.2 }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-5xl mb-4">💜</p>
          <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
            Start Your <span className="gradient-text">Love Story</span> Today
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgb(var(--text-muted))" }}>Join thousands of couples already using PokeUs to stay connected.</p>
          <Link href="/signup" className="btn-brand text-lg py-4 px-10">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-5 border-t" style={{ borderColor: "rgb(var(--border))" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-brand-500 fill-brand-500" />
            <span className="font-display font-bold">PokeUs</span>
          </div>
          <p className="text-sm" style={{ color: "rgb(var(--text-subtle))" }}>
            © 2024 PokeUs. Made with 💜 for couples everywhere.
          </p>
          <div className="flex gap-5 text-sm" style={{ color: "rgb(var(--text-muted))" }}>
            <Link href="#" className="hover:text-brand-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-brand-400 transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-brand-400 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
