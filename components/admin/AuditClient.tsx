'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'approve_payment', label: 'Payment Approved' },
  { value: 'reject_payment', label: 'Payment Rejected' },
  { value: 'change_role', label: 'Role Changed' },
  { value: 'toggle_user_active', label: 'User Toggled' },
];

const ACTION_COLORS: Record<string, string> = {
  approve_payment: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  reject_payment: 'bg-red-50 text-red-700 border-red-100',
  change_role: 'bg-purple-50 text-purple-700 border-purple-100',
  toggle_user_active: 'bg-amber-50 text-amber-700 border-amber-100',
};

export const AuditClient: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [action]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Audit Log</h1>
        <p className="text-sm text-slate-500 font-medium">All admin actions are recorded here</p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold cursor-pointer outline-none focus:border-[#07CCFD]"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border ${
                          ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-700 border-slate-100'
                        }`}
                      >
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {log.actor?.full_name || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {log.actor_role?.replace('_', ' ')}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 rounded-lg p-2 mt-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                    <div className="text-[10px] text-slate-400 font-medium mt-2">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};