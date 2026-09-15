'use client';

import React, { useEffect, useState } from 'react';
import { Download, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const LeadsClient: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setLeads(data.leads || []);
      setPagination(data.pagination);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/leads/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Leads</h1>
          <p className="text-sm text-slate-500 font-medium">
            {pagination.total} students signed up
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </div>

      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#07CCFD]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">
                    <th className="p-4">Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Age</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{l.full_name || '—'}</td>
                      <td className="p-4 text-slate-600 font-medium">{l.phone || '—'}</td>
                      <td className="p-4 capitalize text-slate-600">{l.gender || '—'}</td>
                      <td className="p-4 text-slate-600">{l.age_group || '—'}</td>
                      <td className="p-4 capitalize text-slate-600">
                        {l.life_status?.replace('_', ' ') || '—'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};