'use client';

import React, { useState } from 'react';
import { Download, UserCheck, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialLeads: any[];
}

export const LeadsClient: React.FC<Props> = ({ initialLeads }) => {
  const [leads] = useState(initialLeads);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.full_name?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.life_status?.toLowerCase().includes(q)
    );
  });

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/leads/export');
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Leads</h1>
          <p className="text-sm text-slate-500 font-medium">{leads.length} students signed up</p>
        </div>
        <button
          onClick={handleExport}
          disabled={downloading || leads.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[3px] border-[#047857] hover:border-b-[1px] hover:translate-y-[2px] text-white text-sm font-bold shadow-[0_8px_20px_rgba(32,180,134,0.3)] transition-all cursor-pointer disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Export CSV</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-white text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Gender</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Age</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{l.full_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{l.gender || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{l.age_group || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{l.life_status?.replace('_', ' ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};