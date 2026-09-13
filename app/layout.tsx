import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader'; // 👈 1. IMPORT THIS
import { RootLayoutClient } from '@/components/RootLayoutClient';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Awraq — Master Digital Marketing',
  description:
    'Learn digital marketing step by step with practical courses, live sessions, and simple guides.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {/* 2. ADD TOP LOADER HERE (Awraq Cyan color) */}
        <NextTopLoader
          color="#07CCFD"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #07CCFD,0 0 5px #07CCFD"
        />

        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontSize: '14px', fontWeight: 500 },
          }}
        />
      </body>
    </html>
  );
}