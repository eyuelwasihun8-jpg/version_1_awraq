'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { createClient } from '@/lib/supabase-browser';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { toast } from 'sonner';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAIL_THRESHOLD = 3;

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  const needsChallenge = isRegister || failedAttempts >= FAIL_THRESHOLD;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset challenge token when switching modes
  useEffect(() => {
    setTurnstileToken('');
    setTurnstileReset((k) => k + 1);
  }, [isRegister]);

  if (!isOpen) return null;

  const runGuard = async () => {
    const action = isRegister
      ? 'signup'
      : needsChallenge
        ? 'login_challenge'
        : 'login';

    const res = await fetch('/api/auth/guard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        turnstileToken,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Security check failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (needsChallenge && !turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      toast.error('Please complete the security check');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      await runGuard();

      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          toast.error(error.message);
          setTurnstileToken('');
          setTurnstileReset((k) => k + 1);
          setLoading(false);
          return;
        }

        toast.success('Account created! Setting up...');
        onClose();
        window.location.href = '/onboarding';
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setFailedAttempts((n) => n + 1);
          setTurnstileToken('');
          setTurnstileReset((k) => k + 1);
          toast.error(error.message);
          setLoading(false);
          return;
        }

        setFailedAttempts(0);
        toast.success('Welcome back!');
        onClose();

        fetch('/api/onboarding')
          .then((r) => r.json())
          .then((data) => {
            if (data.profile?.onboarding_completed) {
              window.location.href = '/dashboard';
            } else {
              window.location.href = '/onboarding';
            }
          })
          .catch(() => {
            window.location.href = '/onboarding';
          });
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
      setTurnstileToken('');
      setTurnstileReset((k) => k + 1);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (needsChallenge && !turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      toast.error('Please complete the security check first');
      return;
    }

    setGoogleLoading(true);
    try {
      await runGuard();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
        setTurnstileToken('');
        setTurnstileReset((k) => k + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Security check failed');
      setGoogleLoading(false);
      setTurnstileToken('');
      setTurnstileReset((k) => k + 1);
    }
  };

  const handleForgotPassword = () => {
    onClose();
    router.push('/forgot-password');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-[#f0ebe2] grid grid-cols-1 md:grid-cols-12 max-h-[92dvh] overflow-y-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="hidden md:flex md:col-span-5 bg-gradient-to-b from-slate-50 via-slate-50 to-emerald-50/40 p-8 flex-col justify-between border-r border-[#f0ebe2]">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-md border border-[#f0ebe2]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-[#ddb049]">
                  • LIVE
                </span>
                <span className="text-[11px] text-slate-400 font-medium">STRATEGY</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                Master Digital Marketing
              </h4>
            </div>

            <div className="bg-white rounded-xl p-3 shadow-xs border border-[#f0ebe2] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-900">Premium Access</div>
                <div className="text-[10px] text-slate-500">Join 1,000+ students</div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Learn today
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-5">
            <BrandLogo size="sm" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 pr-10">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {isRegister
              ? 'Join over 1,000+ students advancing their digital careers'
              : 'Sign in to access your courses and resources'}
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full mb-4 min-h-[48px] py-3 rounded-xl bg-white border-2 border-[#e8e0d2] hover:border-slate-300 hover:bg-[#fbfaf7] text-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e8e0d2]" />
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
                  className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-[#fbfaf7]/50"
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
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-[#fbfaf7]/50"
                />
              </div>
              {!isRegister && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-slate-500 hover:text-[#ddb049] cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {needsChallenge && (
              <div className="space-y-2">
                {!isRegister && failedAttempts >= FAIL_THRESHOLD && (
                  <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Extra security check required after multiple failed attempts.
                  </p>
                )}
                <div className="flex justify-center">
                  <TurnstileWidget
                    action={isRegister ? 'signup' : 'login'}
                    resetKey={turnstileReset}
                    onVerify={(t) => setTurnstileToken(t)}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => setTurnstileToken('')}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 min-h-[48px] py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 pb-2">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-[#ddb049] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-[#ddb049] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};