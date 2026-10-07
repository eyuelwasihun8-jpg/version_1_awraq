'use client';

import React, { useState } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
};

export const BrandLogo: React.FC<Props> = ({ size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  if (failed) {
    return (
      <span className={`font-black text-[#0a0704] tracking-tighter ${size === 'lg' ? 'text-2xl' : 'text-lg'} ${className}`}>
        Awraq<span className="text-[#ddb049]">Skills</span>
      </span>
    );
  }

  return (
    <img
      src="/awraq-logo-black.png"
      alt="Awraq Skills"
      className={`${sizeClass} w-auto object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
};