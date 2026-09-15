'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export const PaymentsClient: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [txNumber, setTxNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: '10',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPayments(data.payments || []);
      setPagination(data.pagination);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [status, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPayments();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const approve = async (id: string) => {
    if (!txNumber.trim()) {
      toast.error('Transaction number required');
      return;
    }
    setActionId(id);
    try {
      const res = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id, transactionNumber: txNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approve failed');
      toast.success('Payment approved');
      setTxNumber('');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason required');
      return;
    }
    setActionId(id);
    try {
      const res = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id, reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reject failed');
      toast.success('Payment rejected');
      setRejectReason('');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Payments</h1>
        <p className="text-sm text-slate-500 font-medium">
          {pagination.total} total · page {pagination.page} of {pagination.totalPages}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, item, TX..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e0d2] text-sm outline-none focus:border-[#ddb049]"
          />
        </div>
        <div className="flex gap-1 bg-white border border-[#e8e0d2] rounded-xl p-1">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-[#fbfaf7]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-sm font-medium text-slate-500">No payments found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar avatarKey={p.student_avatar} name={p.student_name} size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900 truncate">{p.student_name}</div>
                      <div className="text-xs text-slate-500 font-medium truncate">
                        {p.item_title} · {p.item_type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(p.created_at).toLocaleString()} · {p.payment_method?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      ETB {Number(p.amount).toLocaleString()}
                    </div>
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                        p.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : p.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                {p.receipt_url && (
                  <button
                    onClick={() => setPreviewUrl(p.receipt_url)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ddb049] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Receipt
                  </button>
                )}

                {p.status === 'pending' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <div className="flex gap-2">
                      <input
                        value={txNumber}
                        onChange={(e) => setTxNumber(e.target.value)}
                        placeholder="Transaction number"
                        className="flex-1 px-3 py-2 rounded-lg border border-[#e8e0d2] text-xs font-mono outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => approve(p.id)}
                        disabled={actionId === p.id}
                        className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Approve
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason"
                        className="flex-1 px-3 py-2 rounded-lg border border-[#e8e0d2] text-xs outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => reject(p.id)}
                        disabled={actionId === p.id}
                        className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#f0ebe2] bg-[#fbfaf7] flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-700 px-2">{pagination.page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Receipt" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
};