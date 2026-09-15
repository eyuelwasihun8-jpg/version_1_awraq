'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, ChevronRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

// Staff only — no students
const ROLE_FILTERS = [
  { value: 'all', label: 'All Staff' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'instructor', label: 'Instructor' },
];

export const UsersClient: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role !== 'all') params.set('role', role);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to load staff');
        setUsers([]);
        return;
      }

      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load staff');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [role, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Staff Users</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage sales, instructors, and admins only
          </p>
        </div>

        <Link
          href={`/${PORTAL_SLUG}/users/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or phone..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-white text-sm"
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[#e8e0d2] bg-white text-sm font-bold cursor-pointer outline-none focus:border-[#ddb049]"
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No staff users found</p>
            <p className="text-xs text-slate-400 mt-1">
              Students are managed separately and never shown here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/${PORTAL_SLUG}/users/${u.id}`}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#fbfaf7] transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-black text-slate-900 truncate">
                      {u.full_name || 'Unnamed'}
                    </span>

                    <span
                      className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border ${
                        u.role === 'super_admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : u.role === 'admin'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : u.role === 'sales'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {u.role?.replace('_', ' ')}
                    </span>

                    {!u.is_active && (
                      <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    {u.phone || 'No phone'} · Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};