'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { SignInModal } from './SignInModal';
import { ConsultationModal } from './ConsultationModal';
import { usePathname } from 'next/navigation';

interface ModalContextType {
  openSignIn: () => void;
  openConsultation: () => void;
}

const ModalContext = createContext<ModalContextType>({
  openSignIn: () => {},
  openConsultation: () => {},
});

export const useModals = () => useContext(ModalContext);

interface RootLayoutClientProps {
  children: ReactNode;
}

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

export const RootLayoutClient: React.FC<RootLayoutClientProps> = ({ children }) => {
  const pathname = usePathname();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  const isLearningPage = pathname.startsWith('/learn/');
  const isStaffPortal =
    pathname.startsWith(`/${PORTAL_SLUG}`) || pathname.startsWith(`/${LOGIN_SLUG}`);

  // 1. TOP NAVBAR HIDE RULES
  const hideNavbar =
    isLearningPage ||
    isStaffPortal ||
    pathname.startsWith('/purchase/waiting/') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/certificate') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/onboarding';

  // 2. DARK FOOTER BLOCK HIDE RULES
  // - Never show on learning (PC & Mobile)
  // - Never show on verify, cert, staff, auth, onboarding
  const hideFooterCompletely =
    isLearningPage ||
    isStaffPortal ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/certificate') ||
    pathname.startsWith('/purchase/waiting/') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/onboarding';

  // 3. BOTTOM MOBILE NAV BAR (The icons at the bottom)
  // Show on mobile for Dashboard, Profile, Home, Courses, etc.
  // Only hide on full learning player, staff portal, or auth screens.
  const showMobileBottomNav =
    !isLearningPage &&
    !isStaffPortal &&
    !pathname.startsWith('/purchase/waiting/') &&
    pathname !== '/login' &&
    pathname !== '/signup' &&
    pathname !== '/forgot-password' &&
    pathname !== '/reset-password' &&
    pathname !== '/onboarding';

  return (
    <ModalContext.Provider
      value={{
        openSignIn: () => setIsSignInOpen(true),
        openConsultation: () => setIsConsultationOpen(true),
      }}
    >
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        {!hideNavbar && (
          <Navbar
            onOpenSignIn={() => setIsSignInOpen(true)}
            onOpenConsultation={() => setIsConsultationOpen(true)}
          />
        )}

        <main className="flex-1 flex flex-col">{children}</main>

        {/* DARK NAVY/PURPLE FOOTER BLOCK:
            Wrapped in `hidden lg:block` -> HIDE ON ALL MOBILE SCREENS!
            Only visible on Desktop/PC (and completely hidden when learning on PC)
        */}
        {!hideFooterCompletely && (
          <div className="hidden lg:block">
            <Footer onOpenConsultation={() => setIsConsultationOpen(true)} />
          </div>
        )}

        {/* MOBILE BOTTOM NAVIGATION BAR (Home, Courses, Learning, Profile icons)
            STAYS VISIBLE ON MOBILE!
        */}
        {showMobileBottomNav && <MobileBottomNav />}

        <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        <ConsultationModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
        />
      </div>
    </ModalContext.Provider>
  );
};