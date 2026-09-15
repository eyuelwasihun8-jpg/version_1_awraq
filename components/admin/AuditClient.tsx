'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const AuditClient: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Audit Log</h1>
        <p className="text-sm text-slate-500 font-medium">
          {pagination.total} total actions · page {pagination.page} of {pagination.totalPages}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">No audit logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="text-sm font-black text-slate-900 capitalize">
                      {log.action?.replaceAll('_', ' ')}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      by {log.actor?.full_name || 'Staff'} ({log.actor_role || log.actor?.role})
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Target: {log.target_type} {log.target_id ? `· ${String(log.target_id).slice(0, 8)}…` : ''}
                </div>
                {log.details && (
                  <pre className="mt-2 text-[10px] bg-[#fbfaf7] border border-[#f0ebe2] rounded-lg p-2 overflow-x-auto text-slate-600">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#f0ebe2] bg-[#fbfaf7] flex items-center justify-end gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};