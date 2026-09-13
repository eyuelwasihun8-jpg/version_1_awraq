'use client';

import React from 'react';
import { useModals } from '@/components/RootLayoutClient';

export const FinalCTASection: React.FC = () => {
  const { openConsultation } = useModals();

  const scrollToCourses = () => {
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 sm:py-24 relative z-10 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8 relative z-10">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Ready to Start Learning?
        </h2>
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          Explore our programs or get personal help with your marketing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4 sm:pt-6 px-4">
          <button
            onClick={scrollToCourses}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-[#07CCFD] hover:bg-[#06b8e4] text-[#0F172A] text-base sm:text-lg font-black shadow-[0_10px_30px_rgba(7,204,253,0.3)] border-b-[5px] border-[#05a3ca] hover:border-b-[2px] hover:translate-y-[3px] transition-all cursor-pointer"
          >
            Start Learning
          </button>
          <button
            onClick={openConsultation}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-base sm:text-lg font-bold shadow-sm transition-all cursor-pointer"
          >
            Book a Consultation
          </button>
        </div>
      </div>
    </section>
  );
};