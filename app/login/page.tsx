"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/frontend/components/layouts/AuthLayout";
import { loginSchema, type LoginInput } from "@/backend/validations";
import { useAuthStore } from "@/frontend/store";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setCouple } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

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

      setUser(json.user);
      setCouple(json.couple);
      toast.success(`Welcome back, ${json.user.name}! 💜`);

      if (json.requiresVerification) {
        // Full navigation so the browser commits the HttpOnly cookie before middleware runs
        window.location.href = `/verify-otp?email=${encodeURIComponent(data.email)}`;
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your private space 💜">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
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
      </form>
      <p className="text-center text-sm mt-5" style={{ color: "rgb(var(--text-muted))" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold gradient-text">Sign up free</Link>
      </p>
    </AuthLayout>
  );
}
