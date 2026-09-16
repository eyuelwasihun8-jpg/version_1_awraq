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

// 🔑 EXPORT THIS HOOK SO OTHER COMPONENTS CAN USE IT
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
  const isStaffPortal = pathname.startsWith(`/${PORTAL_SLUG}`) || pathname.startsWith(`/${LOGIN_SLUG}`);

  const hideNavbar =
    isLearningPage ||
    isStaffPortal ||
    pathname.startsWith('/purchase/waiting/') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/onboarding';

  // Hide footer on mobile for learning pages, but show on desktop
  const hideFooter = isLearningPage;

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

        {/* Footer: hide on mobile for learning pages, show on desktop */}
        {!hideFooter && <Footer onOpenConsultation={() => setIsConsultationOpen(true)} />}
        {hideFooter && (
          <footer className="hidden lg:block">
            <Footer onOpenConsultation={() => setIsConsultationOpen(true)} />
          </footer>
        )}

        {!hideNavbar && <MobileBottomNav />}

        <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        <ConsultationModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
        />
      </div>
    </ModalContext.Provider>
  );
};