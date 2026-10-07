'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

  const fetchLeads = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
      });
      if (currentSearch.trim()) params.set('search', currentSearch.trim());

      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load leads');

      setLeads(data.leads || []);
      const total = data.pagination?.total ?? data.total ?? 0;
      const totalPages = data.pagination?.totalPages ?? data.totalPages ?? 1;

      setPagination({
        page: currentPage,
        total,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page changes
  useEffect(() => {
    fetchLeads(page, search);
  }, [page, fetchLeads]);

  // Handle debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // Triggers the [page] useEffect
      } else {
        fetchLeads(1, search);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search, fetchLeads]);

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
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('All leads exported to CSV!');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Leads</h1>
          <p className="text-sm text-slate-500 font-medium">
            {pagination.total} student{pagination.total !== 1 ? 's' : ''} signed up
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer disabled:opacity-50 transition-all shadow-sm"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e0d2] text-sm outline-none focus:border-[#ddb049] bg-white shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden min-h-[350px]">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center text-sm font-medium text-slate-500">
            No leads found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fbfaf7] text-[10px] uppercase font-black tracking-wider text-slate-500 text-left border-b border-[#e8e0d2]">
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
                    <tr key={l.id} className="hover:bg-[#fbfaf7] transition-colors">
                      <td className="p-4 font-bold text-slate-900">{l.full_name || '—'}</td>
                      <td className="p-4 text-slate-600 font-mono font-medium">{l.phone || '—'}</td>
                      <td className="p-4 capitalize text-slate-600">{l.gender || '—'}</td>
                      <td className="p-4 text-slate-600">{l.age_group || '—'}</td>
                      <td className="p-4 capitalize text-slate-600">
                        {l.life_status?.replace('_', ' ') || '—'}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#f0ebe2] bg-[#fbfaf7] flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev || loading}
                  className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-30 cursor-pointer hover:bg-slate-50 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-700 px-3">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!hasNext || loading}
                  className="p-2 rounded-lg bg-white border border-[#e8e0d2] disabled:opacity-30 cursor-pointer hover:bg-slate-50 transition-colors"
                  title="Next Page"
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