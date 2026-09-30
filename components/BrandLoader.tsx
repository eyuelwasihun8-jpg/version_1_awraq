'use client';

import React from 'react';

interface BrandLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  text = 'Loading Awraq...',
  size = 'lg',
}) => {
  const dimensions = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28 sm:w-36 sm:h-36',
    xl: 'w-36 h-36 sm:w-48 sm:h-48',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6 select-none">
      {/* Logo container with golden aura pulse */}
      <div className={`relative ${dimensions[size]} flex items-center justify-center`}>
        {/* Glowing Background Pulse Ring */}
        <div className="absolute inset-0 rounded-full bg-[#ddb049]/20 blur-xl animate-pulse-ring" />

        {/* Animated Gold Emblem */}
        <img
          src="/awraq-icon.png"
          alt="Awraq Logo"
          className="w-full h-full object-contain relative z-10 animate-logo-float"
        />
      </div>

      {/* Styled Loading Text */}
      {text && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-[0.22em] uppercase text-[#ddb049] animate-pulse">
            {text}
          </span>
        </div>
      )}
    </div>
  );
};