"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/frontend/components/layouts/AuthLayout";
import { forgotPasswordSchema } from "@/backend/validations";
import Link from "next/link";
import { z } from "zod";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&mode=reset`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we'll send you a reset code">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>Email address</label>
          <input {...register("email")} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3">
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Code"}
        </button>
      </form>
      <Link href="/login" className="flex items-center justify-center gap-2 mt-5 text-sm font-medium" style={{ color: "rgb(var(--text-muted))" }}>
        <ArrowLeft size={16} /> Back to login
      </Link>
    </AuthLayout>
  );
}
