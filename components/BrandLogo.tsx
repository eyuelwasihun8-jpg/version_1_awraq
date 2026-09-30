import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  className?: string;
  showLink?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  iconOnly = false,
  className = '',
  showLink = false,
}) => {
  // Height constraints carefully tuned so it stays centered inside the navbar
  const heightClasses = {
    sm: 'max-h-6 sm:max-h-7',
    md: 'max-h-8 sm:max-h-9',
    lg: 'max-h-10 sm:max-h-12',
  };

  const isLightVariant = variant === 'light';
  const logoSrc = iconOnly ? '/awraq-icon.png' : '/awraq-logo-black.png';

  const logoElement = (
    <div className={`inline-flex items-center justify-center my-auto py-1 select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Awraq Skills"
        className={`${heightClasses[size]} w-auto object-contain transition-transform active:scale-95 ${
          isLightVariant ? 'brightness-0 invert' : ''
        }`}
        onError={(e) => {
          if (!iconOnly) {
            (e.target as HTMLImageElement).src = '/awraq-icon.png';
          }
        }}
      />
    </div>
  );

  if (showLink) {
    return (
      <Link href="/" className="inline-flex items-center my-auto cursor-pointer">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};