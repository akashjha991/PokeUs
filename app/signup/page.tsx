"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/frontend/components/layouts/AuthLayout";
import { signupSchema, type SignupInput } from "@/backend/validations";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success("Account created! Check your email for a verification code.");
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join PokeUs and connect with your partner 💜">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Full Name</label>
          <input {...register("name")} className="input-field" placeholder="Your name" autoComplete="name" />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Email</label>
          <input {...register("email")} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Password</label>
          <div className="relative">
            <input {...register("password")} type={showPassword ? "text" : "password"} className="input-field pr-12" placeholder="Min 8 chars, 1 uppercase, 1 number" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "rgb(var(--text-muted))" }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3 mt-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
        </button>
      </form>
      <p className="text-center text-sm mt-5" style={{ color: "rgb(var(--text-muted))" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold gradient-text">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
