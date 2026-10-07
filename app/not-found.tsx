import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#e8e0d2] space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        <div className="space-y-2">
          <span className="text-6xl font-black text-[#ddb049] tracking-tight">404</span>
          <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            The page you are looking for might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/courses"
            className="w-full py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] text-[#0a0704] text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse All Courses</span>
          </Link>

          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}