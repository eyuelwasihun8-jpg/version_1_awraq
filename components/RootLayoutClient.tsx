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

  const hideChrome =
  pathname.startsWith('/learn/') ||
  pathname.startsWith(`/${PORTAL_SLUG}`) ||
  pathname.startsWith(`/${LOGIN_SLUG}`) ||
  pathname.startsWith('/purchase/') ||   // 🆕 ADD
  pathname.startsWith('/certificate/') || // 🆕 ADD (optional)
  pathname === '/login' ||
  pathname === '/signup' ||
  pathname === '/forgot-password' ||
  pathname === '/reset-password' ||
  pathname === '/onboarding';

  return (
    <ModalContext.Provider
      value={{
        openSignIn: () => setIsSignInOpen(true),
        openConsultation: () => setIsConsultationOpen(true),
      }}
    >
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        {!hideChrome && (
          <Navbar
            onOpenSignIn={() => setIsSignInOpen(true)}
            onOpenConsultation={() => setIsConsultationOpen(true)}
          />
        )}

        <main className="flex-1 flex flex-col">{children}</main>

        {!hideChrome && <Footer onOpenConsultation={() => setIsConsultationOpen(true)} />}

        {!hideChrome && <MobileBottomNav />}

        <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        <ConsultationModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
        />
      </div>
    </ModalContext.Provider>
  );
};