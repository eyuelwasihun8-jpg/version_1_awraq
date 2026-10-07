import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Account',
    template: '%s | Awraq Skills',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}