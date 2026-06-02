"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#08061a] px-4 py-12">
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-3xl">💜</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-outfit">
            PokeUs
          </span>
        </div>
        <p className="text-zinc-400 text-sm">Start your love story together</p>
      </motion.div>

      {/* Clerk SignUp Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SignUp
          routing="hash"
          fallbackRedirectUrl="/dashboard"
          signInUrl="/login"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-xs text-zinc-600"
      >
        <Link href="/privacy" className="hover:text-purple-400 transition-colors">
          Privacy Policy
        </Link>
      </motion.p>
    </div>
  );
}
