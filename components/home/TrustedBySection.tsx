'use client';

import React, { useState } from 'react';

export const TrustedBySection: React.FC = () => {
  const [failedLogos, setFailedLogos] = useState<Record<number, boolean>>({});

  const logos = [
    { src: '/logos/coca-cola.png', name: 'Coca Cola' },
    { src: '/logos/coop.png', name: 'Coop Bank' },
    { src: '/logos/ethio-telecom.png', name: 'Ethio Telecom' },
    { src: '/logos/safaricom.png', name: 'Safaricom' },
    { src: '/logos/usaid.png', name: 'USAID' },
    { src: '/logos/yango.png', name: 'Yango' },
  ];

  return (
    <section className="py-8 bg-white border-y border-[#f0ebe2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
          Trusted by growing Ethiopian brands &amp; businesses
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all">
          {logos.map((logo, idx) =>
            failedLogos[idx] ? null : (
              <img
                key={idx}
                src={logo.src}
                alt={logo.name}
                className="h-7 sm:h-9 w-auto object-contain transition-transform hover:scale-105"
                onError={() => setFailedLogos((prev) => ({ ...prev, [idx]: true }))}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};