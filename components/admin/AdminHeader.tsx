'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface AdminHeaderProps {
  userName: string | null;
  role: string;
  pendingPayments?: number;
}

const SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales: 'Sales',
  instructor: 'Instructor',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-100',
  admin: 'bg-blue-50 text-blue-700 border-blue-100',
  sales: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  instructor: 'bg-amber-50 text-amber-700 border-amber-100',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  userName,
  role,
  pendingPayments = 0,
}) => {
  const router = useRouter();
  const [pending, setPending] = useState(pendingPayments);
  const canSeePayments = ['super_admin', 'admin', 'sales'].includes(role);

  useEffect(() => {
    setPending(pendingPayments);
  }, [pendingPayments]);

  useEffect(() => {
    if (!canSeePayments) return;

    const refresh = async () => {
      try {
        const res = await fetch('/api/admin/payments/pending-count', {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count === 'number') setPending(data.count);
      } catch {}
    };

    const interval = setInterval(refresh, 30_000);
    const onChanged = () => refresh();
    window.addEventListener('awraq:payments-changed', onChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('awraq:payments-changed', onChanged);
    };
  }, [canSeePayments]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-[#e8e0d2] px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="pl-14 lg:pl-0">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Welcome,{' '}
          <span className="text-slate-900 font-bold">{userName || 'Admin'}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Payments alarm pin (desktop) */}
        {canSeePayments && pending > 0 && (
          <Link
            href={`/${SLUG}/payments?status=pending`}
            className="relative hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-black hover:bg-red-100 transition-all cursor-pointer"
            title={`${pending} pending payment${pending === 1 ? '' : 's'}`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Payments</span>
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
              {pending > 99 ? '99+' : pending}
            </span>
          </Link>
        )}

        <span
          className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border ${
            ROLE_COLORS[role] || 'bg-[#fbfaf7] text-slate-700 border-[#f0ebe2]'
          }`}
        >
          {ROLE_LABELS[role] || role}
        </span>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e8e0d2] text-slate-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};