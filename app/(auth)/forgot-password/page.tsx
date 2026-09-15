'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { BrandLogo } from '@/components/BrandLogo';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    toast.success('Password reset email sent!');
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e8e0d2] p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Check your email</h1>
          <p className="text-slate-600 text-sm mb-6">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] font-bold text-sm cursor-pointer"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col">
      <div className="p-4 sm:p-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-[#ddb049] font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-[#e8e0d2] p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <BrandLogo size="lg" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-2">
              Forgot password?
            </h1>
            <p className="text-sm text-slate-500 text-center mb-6">
              Enter your email and we&apos;ll send you a reset link
            </p>

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
                    className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-[#fbfaf7]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}