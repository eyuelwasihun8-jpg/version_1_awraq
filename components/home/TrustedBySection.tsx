'use client';

import React from 'react';

const TRUSTED_LOGOS = [
  { name: 'Yango', src: '/logos/yango.png' },
  { name: 'Khilx', src: '/logos/khilx.png' },
  { name: 'Green Hand', src: '/logos/green-hand.png' },
  { name: 'Partner M', src: '/logos/m.png' },
  { name: 'Partner 5', src: '/logos/partner5.png' },
  { name: 'Partner 6', src: '/logos/partner6.png' },
];

export const TrustedBySection: React.FC = () => {
  const logos = [...TRUSTED_LOGOS, ...TRUSTED_LOGOS];

  return (
    <section className="relative py-10 sm:py-14 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-900">
          Trusted By
        </h2>
      </div>

      {/* Full-width marquee */}
      <div className="relative w-full">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="overflow-hidden">
          <div className="flex items-center gap-12 sm:gap-16 md:gap-20 animate-marquee px-8">
            {logos.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="shrink-0 h-12 sm:h-14 md:h-16 flex items-center justify-center bg-transparent"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain opacity-100 brightness-110 contrast-125"
                  style={{ background: 'transparent' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};