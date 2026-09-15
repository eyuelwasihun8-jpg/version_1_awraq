'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

interface AdminSidebarProps {
  role: string;
}

const SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ role }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    },
    {
      href: `/${SLUG}/students`,
      // Sales see "My Students", everyone else sees "Students"
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
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center cursor-pointer"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
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
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>
    </>
  );
};