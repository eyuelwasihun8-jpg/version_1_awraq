'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  BookOpen,
  UserCheck,
  FileText,
  Menu,
  X,
  ArrowLeft,
  Package,
  GraduationCap,
  Quote,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

interface AdminSidebarProps {
  role: string;
  initialPendingPayments?: number;
}

const SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  role,
  initialPendingPayments = 0,
}) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(initialPendingPayments);

  const canSeePayments = ['super_admin', 'admin', 'sales'].includes(role);

  const fetchPendingCount = useCallback(async () => {
    if (!canSeePayments) return;
    try {
      const res = await fetch('/api/admin/payments/pending-count', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.count === 'number') {
        setPendingPayments(data.count);
      }
    } catch {
      // silent — badge just stays at last known value
    }
  }, [canSeePayments]);

  // Keep badge fresh while staff is in the portal
  useEffect(() => {
    setPendingPayments(initialPendingPayments);
  }, [initialPendingPayments]);

  useEffect(() => {
    if (!canSeePayments) return;

    fetchPendingCount();

    const interval = setInterval(fetchPendingCount, 30_000);

    // Refresh when tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchPendingCount();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Refresh when staff finishes an approve/reject on the payments page
    const onPaymentsChanged = () => fetchPendingCount();
    window.addEventListener('awraq:payments-changed', onPaymentsChanged);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('awraq:payments-changed', onPaymentsChanged);
    };
  }, [canSeePayments, fetchPendingCount]);

  // Also refresh when navigating onto / away from payments
  useEffect(() => {
    if (pathname.includes('/payments')) {
      fetchPendingCount();
    }
  }, [pathname, fetchPendingCount]);

  const allLinks = [
    {
      href: `/${SLUG}`,
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'sales', 'instructor'],
    },
    {
      href: `/${SLUG}/payments`,
      label: 'Payments',
      icon: Receipt,
      roles: ['super_admin', 'admin', 'sales'],
      badge: pendingPayments,
      badgeTone: 'danger' as const,
    },
    {
      href: `/${SLUG}/students`,
      label: role === 'sales' ? 'My Students' : 'Students',
      icon: GraduationCap,
      roles: ['super_admin', 'admin', 'sales', 'instructor'],
    },
    {
      href: `/${SLUG}/courses`,
      label: 'Courses',
      icon: BookOpen,
      roles: ['super_admin', 'admin', 'instructor'],
    },
    {
      href: `/${SLUG}/products`,
      label: 'Products',
      icon: Package,
      roles: ['super_admin', 'admin', 'instructor'],
    },
    {
      href: `/${SLUG}/testimonials`,
      label: 'Testimonials',
      icon: Quote,
      roles: ['super_admin', 'admin', 'instructor'],
    },
    {
      href: `/${SLUG}/users`,
      label: 'Staff Users',
      icon: Users,
      roles: ['super_admin', 'admin'],
    },
    {
      href: `/${SLUG}/leads`,
      label: 'Leads',
      icon: UserCheck,
      roles: ['super_admin', 'admin', 'sales'],
    },
    {
      href: `/${SLUG}/audit`,
      label: 'Audit Log',
      icon: FileText,
      roles: ['super_admin'],
    },
  ];

  const links = allLinks.filter((l) => l.roles.includes(role));

  const isActive = (href: string) => {
    if (href === `/${SLUG}`) return pathname === `/${SLUG}`;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu toggle + red pin when payments pending */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl bg-white border border-[#e8e0d2] shadow-md flex items-center justify-center cursor-pointer"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        {!mobileOpen && canSeePayments && pendingPayments > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {pendingPayments > 99 ? '99+' : pendingPayments}
          </span>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#e8e0d2] z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#f0ebe2]">
          <Link
            href={`/${SLUG}`}
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <BrandLogo size="sm" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Staff
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            const badge = 'badge' in link ? Number(link.badge || 0) : 0;
            const showBadge = badge > 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-[#fbfaf7]'
                }`}
              >
                <span className="relative shrink-0">
                  <Icon className="w-4 h-4" />
                  {/* tiny pin on the icon when inactive + has pending */}
                  {showBadge && !active && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </span>

                <span className="flex-1">{link.label}</span>

                {showBadge && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      active
                        ? 'bg-red-500 text-white'
                        : 'bg-red-500 text-white shadow-sm animate-pulse'
                    }`}
                    title={`${badge} pending payment${badge === 1 ? '' : 's'}`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[#f0ebe2]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-[#fbfaf7] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>
    </>
  );
};