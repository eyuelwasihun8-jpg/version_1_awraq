import React from 'react';
import { TRUSTED_BRANDS } from '@/data/testimonials';

export const TrustedBySection: React.FC = () => {
  return (
    <section className="py-14 sm:py-16 relative z-10 overflow-hidden bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10 sm:space-y-12 relative">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Trusted By
        </h2>

        <div className="relative w-full flex items-center overflow-hidden py-6 sm:py-8">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

          <div className="flex w-max animate-marquee items-center gap-6 md:gap-10 hover:[animation-play-state:paused] px-4">
            {[...TRUSTED_BRANDS, ...TRUSTED_BRANDS, ...TRUSTED_BRANDS].map((brand, idx) => (
              <div
                key={idx}
                className="relative group shrink-0 w-48 h-24 sm:w-60 sm:h-28 md:w-64 md:h-32 cursor-pointer"
              >
                <div className="relative h-full w-full bg-white rounded-[1.5rem] border border-slate-200 flex items-center justify-center p-4 sm:p-5 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lg">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    loading="lazy"
                    className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};