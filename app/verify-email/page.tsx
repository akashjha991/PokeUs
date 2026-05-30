'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If there's a code param, this is a direct Supabase callback link
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const verified = searchParams.get('verified'); // from our /api/auth/callback redirect

    if (verified === 'true') {
      setStatus('success');
      setMessage('Your email has been verified! You can now sign in.');
      return;
    }

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Verification failed. Please try again.');
      return;
    }

    if (code) {
      // Redirect to the callback API route to exchange the code
      setStatus('loading');
      const callbackUrl = new URL('/api/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('code', code);
      if (searchParams.get('type')) {
        callbackUrl.searchParams.set('type', searchParams.get('type')!);
      }
      router.push(callbackUrl.toString());
      return;
    }

    // No params — informational "check your email" page shown after signup
    setStatus('pending');
  }, [searchParams, router]);

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
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center">

          {/* Pending — informational state after signup */}
          {status === 'pending' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="w-20 h-20 mb-6 bg-pink-500/10 rounded-full flex items-center justify-center">
                <Mail className="text-pink-500" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
              <p className="text-zinc-400 mb-8">
                We've sent a verification link to your email address. Click it to activate your account.
              </p>
              <Link
                href="/login"
                className="w-full bg-white text-black font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
              >
                Return to Login
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}

          {/* Loading — code exchange in progress */}
          {status === 'loading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="w-20 h-20 mb-6 bg-pink-500/10 rounded-full flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
              <p className="text-zinc-400">Please wait while we confirm your email address...</p>
            </motion.div>
          )}

          {/* Success */}
          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className="w-20 h-20 mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-500" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-zinc-400 mb-8">{message}</p>
              <Link
                href="/login"
                className="w-full bg-white text-black font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
              >
                <span>Continue to Login</span>
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className="w-20 h-20 mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="text-red-500" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-zinc-400 mb-8">{message}</p>
              <Link
                href="/login"
                className="w-full border border-white/20 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <span>Back to Login</span>
              </Link>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
        <Loader2 className="animate-spin text-pink-500" size={40} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
