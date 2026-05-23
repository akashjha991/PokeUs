'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email successfully verified!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email. Token might be expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center">
          
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 mb-6 bg-pink-500/10 rounded-full flex items-center justify-center">
                <Loader2 className="animate-spin text-pink-500" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
              <p className="text-zinc-400">Please wait while we confirm your email address...</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
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

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
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
