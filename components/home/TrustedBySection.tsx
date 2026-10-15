'use client';

import React, { useState } from 'react';

const LOGOS = [
  { src: '/logos/coca-cola.png', altSrc: '/logos/coca cola.png', name: 'Coca Cola' },
  { src: '/logos/coop.png', altSrc: '/logos/Coop.png', name: 'Coop Bank' },
  { src: '/logos/ethio-telecom.png', altSrc: '/logos/Ethio Telecom.png', name: 'Ethio Telecom' },
  { src: '/logos/safaricom.png', altSrc: '/logos/Safaricom.png', name: 'Safaricom' },
  { src: '/logos/usaid.png', altSrc: '/logos/USAID.png', name: 'USAID' },
  { src: '/logos/yango.png', altSrc: '/logos/yango.png', name: 'Yango' },
];

export const TrustedBySection: React.FC = () => {
  const [failedLogos, setFailedLogos] = useState<Record<string, number>>({});

  const handleImageError = (indexKey: string, logo: typeof LOGOS[0], targetImg: HTMLImageElement) => {
    const attempts = failedLogos[indexKey] || 0;
    if (attempts === 0 && logo.altSrc) {
      setFailedLogos((prev) => ({ ...prev, [indexKey]: 1 }));
      targetImg.src = logo.altSrc;
    } else {
      setFailedLogos((prev) => ({ ...prev, [indexKey]: 2 }));
    }
  };

  // Double the array for seamless infinite looping
  const marqueeLogos = [...LOGOS, ...LOGOS];

  return (
    <section className="py-8 bg-white border-y border-[#f0ebe2] overflow-hidden relative select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
          Trusted by growing Ethiopian brands &amp; businesses
        </p>
      </div>

      {/* Fade masks on left & right edges for smooth visual gradient */}
      <div className="relative w-full overflow-hidden flex">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Marquee Track */}
        <div className="flex gap-12 sm:gap-16 items-center whitespace-nowrap animate-marquee">
          {marqueeLogos.map((logo, idx) => {
            const itemKey = `${logo.name}-${idx}`;
            const failLevel = failedLogos[itemKey] || 0;

            if (failLevel === 2) {
              return (
                <span
                  key={itemKey}
                  className="text-sm font-black text-slate-400 tracking-tight uppercase px-4"
                >
                  {logo.name}
                </span>
              );
            }

            return (
              <img
                key={itemKey}
                src={logo.src}
                alt={logo.name}
                loading="eager"
                decoding="async"
                className="h-7 sm:h-9 w-auto max-w-[140px] object-contain opacity-70 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0 shrink-0"
                onError={(e) => handleImageError(itemKey, logo, e.currentTarget)}
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};