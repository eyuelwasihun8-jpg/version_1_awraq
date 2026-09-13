'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { BrandLogo } from '@/components/BrandLogo';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      toast.success('Welcome back!');
      if (!data.profile?.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="p-4 sm:p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-[#07CCFD] font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <BrandLogo size="lg" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 text-center mb-6">
              Sign in to access your courses
            </p>

            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full mb-4 min-h-[48px] py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500 font-medium">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-slate-500 hover:text-[#07CCFD]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link href="/signup" className="font-bold text-[#07CCFD] hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}