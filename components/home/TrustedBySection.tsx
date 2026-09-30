'use client';

import React, { useEffect, useState } from 'react';

export function TrustedBySection() {
  const [logos, setLogos] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/logos')
      .then((res) => res.json())
      .then((data) => setLogos(data.logos || []))
      .catch(() => setLogos([]));
  }, []);

  if (logos.length === 0) return null;

  // Duplicate list so the marquee loops seamlessly
  const loopLogos = [...logos, ...logos];

  return (
    <section className="bg-[#0a0704] text-white py-8 sm:py-9 border-y border-[#ddb049]/30 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 text-center mb-5">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.22em] text-slate-400 uppercase">
          Our Instructors are trusted by
        </p>
      </div>

      {/* Scrolling marquee track */}
      <div className="relative w-full overflow-hidden">
        {/* soft edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-[#0a0704] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-[#0a0704] to-transparent" />

        <div className="flex w-max animate-marquee-trusted items-center gap-10 sm:gap-14 hover:[animation-play-state:paused]">
          {loopLogos.map((logoPath, index) => {
            const fileName = logoPath.split('/').pop()?.split('.')[0] || 'Partner';
            const cleanName = fileName.replace(/[-_]/g, ' ');

            return (
              <div
                key={`${logoPath}-${index}`}
                className="h-12 sm:h-14 flex items-center justify-center shrink-0"
                title={cleanName}
              >
                <img
                  src={logoPath}
                  alt={cleanName}
                  className="h-10 sm:h-12 w-auto max-w-[140px] object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}