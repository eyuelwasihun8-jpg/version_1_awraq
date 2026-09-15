'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ReceiptText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  BookOpen,
  Package,
} from 'lucide-react';

interface Props {
  payments: any[];
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const HistoryTab: React.FC<Props> = ({ payments }) => {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = payments.filter((p) => filter === 'all' || p.status === filter);

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-8 sm:p-12 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ReceiptText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">No payment history</h3>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
          Your purchases will appear here.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ddb049] text-[#0a0704] text-sm font-bold cursor-pointer transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Courses</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer transition-all"
          >
            <Package className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    approved: payments.filter((p) => p.status === 'approved').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  };

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">Payment History</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {filtered.length} of {payments.length} transaction{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar bg-white border border-[#e8e0d2] rounded-xl p-1.5">
        <FilterTab active={filter === 'all'} label="All" count={counts.all} onClick={() => setFilter('all')} />
        <FilterTab
          active={filter === 'pending'}
          label="Pending"
          count={counts.pending}
          onClick={() => setFilter('pending')}
          color="amber"
        />
        <FilterTab
          active={filter === 'approved'}
          label="Approved"
          count={counts.approved}
          onClick={() => setFilter('approved')}
          color="emerald"
        />
        <FilterTab
          active={filter === 'rejected'}
          label="Rejected"
          count={counts.rejected}
          onClick={() => setFilter('rejected')}
          color="red"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e0d2] p-8 text-center">
          <p className="text-sm text-slate-500 font-medium">No {filter} payments</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterTab = ({ active, label, count, onClick, color = 'slate' }: any) => {
  const activeColors: Record<string, string> = {
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    red: 'bg-red-500 text-white',
  };

  const badgeColors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
        active ? activeColors[color] : 'text-slate-600 hover:bg-[#fbfaf7]'
      }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
            active ? 'bg-white/20 text-white' : badgeColors[color]
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

const PaymentRow = ({ payment }: { payment: any }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      icon: Clock,
      label: 'Pending Review',
    },
    approved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      icon: CheckCircle2,
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-100',
      icon: XCircle,
      label: 'Rejected',
    },
  };

  const cfg = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="p-4 sm:p-5 hover:bg-[#fbfaf7] transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <Icon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {payment.item_type === 'course' ? '📚 Course' : '📄 Product'}
            </span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {payment.item_title || 'Unknown Item'}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium flex-wrap">
            <span>ETB {Number(payment.amount).toLocaleString()}</span>
            <span>·</span>
            <span>{payment.payment_method?.toUpperCase()}</span>
            <span>·</span>
            <span>
              {new Date(payment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {payment.status === 'approved' && payment.item_type === 'course' && (
          <Link
            href={`/learn/${payment.item_id}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-xs font-bold cursor-pointer transition-all"
          >
            <span>Open</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {payment.status === 'pending' && (
          <Link
            href={`/purchase/waiting/${payment.id}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold cursor-pointer transition-all"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {payment.status === 'approved' && payment.transaction_number && (
        <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 inline-block">
          TX: {payment.transaction_number}
        </div>
      )}
      {payment.status === 'rejected' && payment.rejection_reason && (
        <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
          <span className="font-bold">Reason:</span> {payment.rejection_reason}
        </div>
      )}
    </div>
  );
};