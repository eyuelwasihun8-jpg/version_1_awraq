'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { useUser } from '@/lib/hooks/useUser';
import { createClient } from '@/lib/supabase-browser';
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  User,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenSignIn: () => void;
}

const NAV_LINKS = [
  { label: 'Home', section: 'home' },
  { label: 'About', section: 'about' },
  { label: 'Learn', section: 'courses' },
  { label: 'Resources', section: 'resources' },
  { label: 'Contact', section: 'contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenConsultation,
  onOpenSignIn,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, loading } = useUser();

  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const isHome = pathname === '/';

  // Hides navbar whenever scrolled past top (threshold: 40px)
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;

      setIsScrolled(current > 12);

      // Hide navbar whenever user is scrolled down, show ONLY at top
      if (current > 40 && !mobileMenuOpen) {
        setHidden(true);
        setProfileMenuOpen(false);
      } else {
        setHidden(false);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileData(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (res.ok) setProfileData(data.profile);
      } catch {}
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClick = () => setProfileMenuOpen(false);
    if (profileMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  const handleNavClick = (section: string) => {
    setMobileMenuOpen(false);
    if (isHome) {
      const el = document.getElementById(section);
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      router.push(`/#${section}`);
    }
  };

  const hideOnMobileWhenLoggedIn = isLoggedIn ? 'hidden sm:block' : '';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 safe-top ${hideOnMobileWhenLoggedIn} ${
          hidden && !mobileMenuOpen ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled
            ? 'py-2.5 sm:py-3 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'py-3 sm:py-4 bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="shrink-0" aria-label="Awraq Homepage">
              <BrandLogo size="md" />
            </Link>

            {/* Guest desktop links */}
            {!loading && !isLoggedIn && (
              <nav className="hidden lg:flex items-center gap-7 xl:gap-8 text-sm font-semibold">
                {NAV_LINKS.map((item) => (
                  <button
                    key={item.section}
                    onClick={() => handleNavClick(item.section)}
                    className="text-slate-600 hover:text-[#07CCFD] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            {/* Logged-in desktop links */}
            {!loading && isLoggedIn && (
              <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                <Link
                  href="/courses"
                  className={`text-sm font-bold px-3 lg:px-4 py-2 rounded-xl transition-all ${
                    pathname.startsWith('/courses')
                      ? 'bg-cyan-50 text-[#07CCFD]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Courses
                  </span>
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm font-bold px-3 lg:px-4 py-2 rounded-xl transition-all ${
                    pathname.startsWith('/dashboard') || pathname.startsWith('/learn')
                      ? 'bg-cyan-50 text-[#07CCFD]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    My Learning
                  </span>
                </Link>
              </nav>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {loading ? null : isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen(!profileMenuOpen);
                    }}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 cursor-pointer"
                    title="Profile"
                  >
                    <UserAvatar
                      avatarKey={profileData?.avatar_url}
                      name={profileData?.full_name}
                      size="sm"
                    />
                    <span className="hidden lg:inline text-xs font-bold text-slate-700 max-w-[100px] truncate">
                      {profileData?.full_name?.split(' ')[0] || 'Profile'}
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                        <UserAvatar
                          avatarKey={profileData?.avatar_url}
                          name={profileData?.full_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-black text-slate-900 truncate">
                            {profileData?.full_name || 'User'}
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <GraduationCap className="w-4 h-4" />
                          My Learning
                        </Link>
                        <Link
                          href="/courses"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <BookOpen className="w-4 h-4" />
                          Browse Courses
                        </Link>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={onOpenSignIn}
                    className="hidden sm:inline-block text-sm font-bold text-slate-700 hover:text-[#07CCFD] px-3 py-2 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onOpenConsultation}
                    className="hidden sm:inline-flex text-[#0F172A] text-sm font-bold px-4 lg:px-5 py-2.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] shadow-sm cursor-pointer"
                  >
                    Book Consultation
                  </button>

                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu for guests */}
      {mobileMenuOpen && !isLoggedIn && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 bg-black/40 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-xl px-4 py-5 space-y-4 max-h-[85dvh] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((item) => (
                <button
                  key={item.section}
                  onClick={() => handleNavClick(item.section)}
                  className="text-left text-base font-bold py-3 px-3 rounded-xl text-slate-700 hover:text-[#07CCFD] hover:bg-slate-50 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full min-h-[48px] bg-[#07CCFD] text-[#0F172A] py-3 rounded-xl font-bold text-sm cursor-pointer"
              >
                Book Consultation
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignIn();
                }}
                className="w-full min-h-[48px] bg-slate-100 text-slate-800 py-3 rounded-xl font-bold text-sm cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};