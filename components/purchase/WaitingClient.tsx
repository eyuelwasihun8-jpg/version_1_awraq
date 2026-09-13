'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Home,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

interface Props {
  initialPayment: any;
}

export const WaitingClient: React.FC<Props> = ({ initialPayment }) => {
  const [payment, setPayment] = useState(initialPayment);
  const [elapsed, setElapsed] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  const targetUrl =
    payment.item_type === 'course'
      ? `/learn/${payment.item_id}`
      : '/dashboard';

  const triggerRedirect = () => {
    setRedirecting(true);
    // Use hard window navigation to bypass Next.js client-side router stalling
    window.location.href = targetUrl;
  };

  // 1. SUPABASE REALTIME WEBSOCKET (Instant 0.1s Approval Detection)
  useEffect(() => {
    if (payment.status !== 'pending') return;

    const supabase = createClient();

    const channel = supabase
      .channel(`payment-${payment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_requests',
          filter: `id=eq.${payment.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated) {
            setPayment(updated);
            if (updated.status === 'approved') {
              triggerRedirect();
            }
          }
        }
      )
      .subscribe();

    // Backup polling every 8 seconds (fast backup)
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', payment.id)
        .single();

      if (data) {
        setPayment(data);
        if (data.status === 'approved') {
          clearInterval(interval);
          triggerRedirect();
        }
      }
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [payment.id, payment.status]);

  // If initial load is already approved (e.g. user refreshed after admin approved)
  useEffect(() => {
    if (payment.status === 'approved' && !redirecting) {
      triggerRedirect();
    }
  }, [payment.status]);

  // Timer
  useEffect(() => {
    const start = new Date(payment.created_at).getTime();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [payment.created_at]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const retryHref =
    payment.item_type === 'course'
      ? `/purchase/item/course/${payment.item_id}`
      : `/purchase/item/digital_product/${payment.item_id}`;

  // ─── APPROVED SCREEN ───
  if (payment.status === 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-10 max-w-md w-full text-center animate-slideUp">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#20B486]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Approved! 🎉</h1>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Your course access is unlocked. Redirecting you now...
          </p>

          <a
            href={targetUrl}
            className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[4px] border-[#047857] hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <BookOpen className="w-4 h-4" />
            <span>Start Learning Now</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#20B486]" />
            <span>Auto-redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── REJECTED SCREEN ───
  if (payment.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-red-200 shadow-xl p-8 sm:p-10 max-w-md w-full animate-slideUp">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">Payment Rejected</h1>
          <p className="text-sm text-slate-500 font-medium mb-4 text-center">
            Your payment could not be verified.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="text-[10px] uppercase font-black text-red-700 tracking-wider mb-1">
              Admin Rejection Reason
            </div>
            <p className="text-sm text-red-900 font-bold">
              {payment.rejection_reason || 'No reason provided.'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={retryHref}
              className="w-full py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] text-[#0F172A] text-sm font-bold text-center cursor-pointer transition-all"
            >
              Try Uploading Again
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold text-center cursor-pointer transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── PENDING WAITING SCREEN ───
  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 relative">
          <Clock className="w-8 h-8 text-amber-500" />
          <div className="absolute inset-0 rounded-2xl border-4 border-amber-300 border-t-transparent animate-spin" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Under Review</h1>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Our team is verifying your receipt. You will be redirected automatically as soon as it's approved.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2 text-left border border-slate-100">
          <InfoRow label="Amount" value={`ETB ${Number(payment.amount).toLocaleString()}`} />
          <InfoRow label="Method" value={payment.payment_method?.toUpperCase()} />
          <InfoRow label="Status" value="Pending Review" />
          <InfoRow label="Time Waiting" value={formatTime(elapsed)} />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium mb-4">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#07CCFD]" />
          <span>Realtime active — listening for approval...</span>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Wait on Dashboard instead</span>
        </Link>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);