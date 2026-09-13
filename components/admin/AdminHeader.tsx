'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface AdminHeaderProps {
  userName: string | null;
  role: string;
}

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

export const AdminHeader: React.FC<AdminHeaderProps> = ({ userName, role }) => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="pl-14 lg:pl-0">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Welcome, <span className="text-slate-900 font-bold">{userName || 'Admin'}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border ${ROLE_COLORS[role] || 'bg-slate-50 text-slate-700 border-slate-100'}`}
        >
          {ROLE_LABELS[role] || role}
        </span>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};