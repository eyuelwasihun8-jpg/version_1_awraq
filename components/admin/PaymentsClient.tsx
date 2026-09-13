'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, Receipt, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Status = 'pending' | 'approved' | 'rejected';

export const PaymentsClient: React.FC = () => {
  const [status, setStatus] = useState<Status>('pending');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [txNumber, setTxNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?status=${status}&limit=100`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [status]);

  const handleApprove = async () => {
    if (!selected || !txNumber.trim()) {
      toast.error('Transaction number is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: selected.id, transactionNumber: txNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed');
        return;
      }
      toast.success('Payment approved!');
      setSelected(null);
      setAction(null);
      setTxNumber('');
      fetchPayments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: selected.id, rejectionReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed');
        return;
      }
      toast.success('Payment rejected');
      setSelected(null);
      setAction(null);
      setRejectReason('');
      fetchPayments();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Payments</h1>
        <p className="text-sm text-slate-500 font-medium">Review and process payment receipts</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
        {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize cursor-pointer transition-all ${
              status === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'pending' && <Clock className="w-3.5 h-3.5" />}
            {s === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {s === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No {status} payments</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        {p.user?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-medium">{p.user?.phone}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-2 line-clamp-1">
                      {p.item_type === 'course' ? '📚' : '📄'} {p.item_title || p.item_id}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        ETB {Number(p.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {p.payment_method}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(p.created_at).toLocaleString()}
                      </span>
                    </div>
                    {p.transaction_number && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 inline-block">
                        TX: {p.transaction_number}
                      </div>
                    )}
                    {p.rejection_reason && (
                      <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                        Reason: {p.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {p.receipt_url && (
                      <button
                        onClick={() => setSelected(p)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    )}
                    {p.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelected(p);
                            setAction('approve');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelected(p);
                            setAction('reject');
                          }}
                          className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold cursor-pointer transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setSelected(null);
            setAction(null);
            setTxNumber('');
            setRejectReason('');
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                {action === 'approve' ? 'Approve Payment' : action === 'reject' ? 'Reject Payment' : 'Receipt'}
              </h3>
              <button
                onClick={() => {
                  setSelected(null);
                  setAction(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Student:</span>{' '}
                  <span className="font-bold text-slate-900">{selected.user?.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Amount:</span>{' '}
                  <span className="font-bold text-slate-900">ETB {Number(selected.amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Method:</span>{' '}
                  <span className="font-bold text-slate-900 uppercase">{selected.payment_method}</span>
                </div>
              </div>

              {/* Receipt image */}
              {selected.receipt_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={selected.receipt_url}
                    alt="Receipt"
                    className="w-full object-contain max-h-[400px]"
                  />
                </div>
              )}

              {/* Approve form */}
              {action === 'approve' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Transaction Number *
                  </label>
                  <input
                    type="text"
                    value={txNumber}
                    onChange={(e) => setTxNumber(e.target.value)}
                    placeholder="e.g. FT12345ABCD"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Verify the transaction in your bank app, then enter the reference number.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={submitting || !txNumber.trim()}
                    className="w-full mt-4 min-h-[48px] py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[4px] border-[#047857] hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold shadow-[0_8px_20px_rgba(32,180,134,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{submitting ? 'Approving...' : 'Confirm Approval'}</span>
                  </button>
                </div>
              )}

              {/* Reject form */}
              {action === 'reject' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Receipt amount doesn't match / Fake receipt / Wrong account..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-slate-50/50 text-sm resize-none"
                  />
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectReason.trim()}
                    className="w-full mt-4 min-h-[48px] py-3.5 rounded-xl bg-red-500 hover:bg-red-600 border-b-[4px] border-red-700 hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    <span>{submitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};