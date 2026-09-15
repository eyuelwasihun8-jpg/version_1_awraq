import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  className = '',
}) => {
  const isDark = variant === 'dark';
  const textColor = isDark ? 'text-[#0a0704]' : 'text-white';
  const bracketColor = isDark ? 'text-[#6b6358]' : 'text-gray-400';

  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-xs' },
    md: { icon: 'w-9 h-9', text: 'text-sm' },
    lg: { icon: 'w-11 h-11', text: 'text-base' },
  };

  return (
    <div className={`flex flex-col items-center select-none cursor-pointer ${className}`}>
      <svg
        className={`${dimensions[size].icon} text-[#ddb049]`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 3L35 11.66V28.34L20 37L5 28.34V11.66L20 3Z"
          stroke="#ddb049"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M14 13V27M26 13V27M14 20H26"
          stroke="#ddb049"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex items-center gap-0.5 mt-0.5 leading-none">
        <span className={`text-[10px] font-mono font-medium ${bracketColor}`}>[</span>
        <span
          className={`font-sans font-black tracking-widest uppercase ${textColor} ${dimensions[size].text}`}
          style={{ letterSpacing: '0.18em' }}
        >
          AWRAQ
        </span>
        <span className={`text-[10px] font-mono font-medium ${bracketColor}`}>]</span>
      </div>
    </div>
  );
};