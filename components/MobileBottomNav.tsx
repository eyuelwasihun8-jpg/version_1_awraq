'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GraduationCap, User } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isLoggedIn, loading } = useUser();

  // Only show for logged-in students
  if (loading || !isLoggedIn) return null;

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/dashboard', label: 'Learning', icon: GraduationCap },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/dashboard') return pathname.startsWith('/dashboard') || pathname.startsWith('/learn');
    return pathname.startsWith(href);
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8e0d2] safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 min-h-[56px] cursor-pointer transition-colors ${
                active ? 'text-[#ddb049]' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-all ${
                  active ? 'bg-amber-50' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold ${active ? 'text-[#ddb049]' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};