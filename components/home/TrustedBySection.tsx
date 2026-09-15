'use client';

import React, { useState } from 'react';

type LogoItem = {
  name: string;
  src: string;
};

/**
 * IMPORTANT:
 * Put your real logo files in /public/logos/
 * Example:
 * public/logos/yango.png
 * public/logos/khilx.png
 */
const TRUSTED_LOGOS: LogoItem[] = [
  { name: 'Yango', src: '/logos/yango.png' },
  { name: 'Khilx', src: '/logos/khilx.png' },
  { name: 'Green Hand', src: '/logos/green-hand.png' },
  { name: 'Coop', src: '/logos/coop.png' },
  { name: 'USAID', src: '/logos/usaid.png' },
  { name: 'Safaricom', src: '/logos/safaricom.png' },
  { name: 'Ethio Telecom', src: '/logos/ethio-telecom.png' },
  { name: 'Coca Cola', src: '/logos/coca-cola.png' },
  { name: 'Awash Bank', src: '/logos/awash-bank.png' },
  { name: 'Meta Beer', src: '/logos/meta.png' },
];

export const TrustedBySection: React.FC = () => {
  const logos = [...TRUSTED_LOGOS, ...TRUSTED_LOGOS];

  return (
    <section className="relative w-full bg-[#0B0F17] py-10 sm:py-12 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ddb049] via-[#F86BCF] to-[#ddb049]" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ddb049] via-[#F86BCF] to-[#ddb049]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-7 sm:mb-8">
        <h2 className="text-center text-sm sm:text-base md:text-lg font-medium text-white/90 tracking-wide">
          Our Instructors are trusted by
        </h2>
      </div>

      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#0B0F17] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#0B0F17] to-transparent z-10" />

        <div className="overflow-hidden">
          {/* continuous scroll, does NOT pause */}
          <div className="flex items-center gap-12 sm:gap-16 md:gap-20 animate-marquee-trusted px-8">
            {logos.map((logo, i) => (
              <LogoBadge key={`${logo.name}-${i}`} name={logo.name} src={logo.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const LogoBadge = ({ name, src }: { name: string; src: string }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="shrink-0 h-12 sm:h-14 md:h-16 min-w-[120px] sm:min-w-[140px] flex items-center justify-center"
      title={name}
    >
      {!failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="
            h-8 sm:h-9 md:h-11 w-auto max-w-[160px] object-contain
            opacity-75 brightness-0 invert
            transition-all duration-300 ease-out
            hover:opacity-100 hover:brightness-125 hover:scale-105
          "
          style={{ background: 'transparent' }}
        />
      ) : (
        <span className="text-white/80 hover:text-white text-xs sm:text-sm font-bold tracking-wide transition-colors">
          {name}
        </span>
      )}
    </div>
  );
};