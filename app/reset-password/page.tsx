"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/frontend/lib/supabase";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetInput = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  });

  // Supabase redirects to /reset-password with a code — the /api/auth/callback
  // route exchanges it for a session and redirects back here.
  // At this point the session cookies are already set.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSessionReady(true);
      } else {
        setStatus("error");
        setErrorMessage(
          "Invalid or expired reset link. Please request a new one."
        );
      }
    });
  }, []);

  async function onSubmit(data: ResetInput) {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(json.error || "Failed to reset password.");
        return;
      }

      setStatus("success");
      toast.success("Password reset successfully!");

      // Sign out and redirect to login after 2s
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Error state */}
          {status === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Link Invalid</h1>
              <p className="text-zinc-400 mb-6">{errorMessage}</p>
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3.5"
              >
                Request New Link
              </Link>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
              <p className="text-zinc-400 mb-2">
                Your password has been updated. Redirecting to login...
              </p>
              <Loader2 className="animate-spin text-pink-500 mx-auto mt-4" size={24} />
            </div>
          )}

          {/* Form state */}
          {status !== "error" && status !== "success" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-zinc-400">Enter your new password below</p>
              </div>

              {!sessionReady && status !== "loading" ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-pink-500" size={32} />
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-pink-500 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        {...register("password")}
                        type="password"
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-2">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-pink-500 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        {...register("confirmPassword")}
                        type="password"
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-2">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || status === "loading"}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-pink-500/25"
                  >
                    {isSubmitting || status === "loading" ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <Loader2 className="animate-spin text-pink-500" size={40} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
