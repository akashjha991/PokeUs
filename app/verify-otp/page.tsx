"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/frontend/components/layouts/AuthLayout";
import { motion } from "framer-motion";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) submitOTP(next.join(""));
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function submitOTP(code: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code, email }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); setOtp(["", "", "", "", "", ""]); inputs.current[0]?.focus(); return; }
      toast.success("Email verified! Welcome to PokeUs 💜");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    if (countdown > 0) return;
    setResending(true);
    try {
      const res = await fetch(`/api/auth/verify-otp?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success("New code sent!");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout title="Verify Email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div className="mt-6 space-y-6">
        <div className="flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              maxLength={1}
              inputMode="numeric"
              disabled={loading}
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

        {loading && (
          <div className="flex items-center justify-center gap-2" style={{ color: "rgb(var(--text-muted))" }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Verifying...</span>
          </div>
        )}

        <button
          onClick={resendOTP}
          disabled={countdown > 0 || resending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            color: countdown > 0 ? "rgb(var(--text-subtle))" : "rgb(217,70,239)",
            background: "rgb(var(--surface-muted))",
          }}
        >
          <RefreshCw size={15} className={resending ? "animate-spin" : ""} />
          {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
        </button>
      </div>
    </AuthLayout>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
