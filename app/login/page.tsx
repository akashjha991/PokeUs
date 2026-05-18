"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/frontend/components/layouts/AuthLayout";
import { loginSchema, type LoginInput } from "@/backend/validations";
import { useAuthStore } from "@/frontend/store";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { setUser, setCouple } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Step 1: verify credentials → send OTP
  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }

      setPendingEmail(data.email);
      setStep("otp");
      startCooldown();
      toast.success("Verification code sent to your email 📧");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) verifyOtp(next.join(""));
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  // Step 2: verify OTP → get session cookies → redirect
  async function verifyOtp(code: string) {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error);
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }
      setUser(json.user);
      setCouple(json.couple);
      toast.success(`Welcome back, ${json.user.name}! 💜`);
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function resendOtp() {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch(`/api/auth/login-verify?email=${encodeURIComponent(pendingEmail)}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success("New code sent to your email!");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      startCooldown();
    } catch {
      toast.error("Could not resend code.");
    }
  }

  return (
    <AuthLayout
      title={step === "credentials" ? "Welcome Back" : "Check Your Email"}
      subtitle={
        step === "credentials"
          ? "Sign in to your private space 💜"
          : `We sent a 6-digit code to ${pendingEmail}`
      }
    >
      <AnimatePresence mode="wait">
        {step === "credentials" ? (
          <motion.form
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 mt-5"
          >
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Email</label>
              <input {...register("email")} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Password</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} className="input-field pr-12" placeholder="Your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "rgb(var(--text-muted))" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm font-medium gradient-text">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="mt-6 space-y-6"
          >
            {/* Shield icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.3)" }}>
                <ShieldCheck size={32} style={{ color: "rgb(217,70,239)" }} />
              </div>
            </div>

            {/* OTP boxes */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  maxLength={1}
                  inputMode="numeric"
                  disabled={otpLoading}
                  whileFocus={{ scale: 1.05 }}
                  className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none"
                  style={{
                    background: "rgb(var(--surface-muted))",
                    borderColor: digit ? "rgb(217,70,239)" : "rgb(var(--border))",
                    color: "rgb(var(--text))",
                    boxShadow: digit ? "0 0 0 3px rgba(217,70,239,0.15)" : "none",
                  }}
                />
              ))}
            </div>

            {otpLoading && (
              <div className="flex items-center justify-center gap-2" style={{ color: "rgb(var(--text-muted))" }}>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Verifying...</span>
              </div>
            )}

            {/* Resend */}
            <button
              onClick={resendOtp}
              disabled={resendCooldown > 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                color: resendCooldown > 0 ? "rgb(var(--text-subtle))" : "rgb(217,70,239)",
                background: "rgb(var(--surface-muted))",
              }}
            >
              <RefreshCw size={15} />
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
            </button>

            {/* Back to login */}
            <button
              onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); }}
              className="w-full text-sm text-center transition-all"
              style={{ color: "rgb(var(--text-subtle))" }}
            >
              ← Back to login
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "credentials" && (
        <p className="text-center text-sm mt-5" style={{ color: "rgb(var(--text-muted))" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold gradient-text">Sign up free</Link>
        </p>
      )}
    </AuthLayout>
  );
}
