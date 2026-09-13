import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Strategy3DIcon: React.FC<IconProps> = ({ className = '', size = 84 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`select-none ${className}`}>
      <defs>
        <radialGradient id="stratSphere" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="75%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <filter id="stratShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#451A03" floodOpacity="0.7" />
        </filter>
      </defs>
      <ellipse cx="50" cy="91" rx="34" ry="7" fill="#050B17" opacity="0.45" />
      <circle cx="50" cy="48" r="40" fill="url(#stratSphere)" />
      <ellipse cx="48" cy="24" rx="26" ry="12" fill="#FFFFFF" opacity="0.32" />
      <g filter="url(#stratShadow)">
        <circle cx="50" cy="48" r="20" stroke="#FFFFFF" strokeWidth="4" fill="#78350F" fillOpacity="0.2" />
        <circle cx="50" cy="48" r="12" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 3" />
        <polygon points="50,30 55,48 50,45 45,48" fill="#EF4444" />
        <polygon points="50,66 55,48 50,51 45,48" fill="#FFFFFF" />
        <circle cx="50" cy="48" r="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const Copywriting3DIcon: React.FC<IconProps> = ({ className = '', size = 84 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`select-none ${className}`}>
      <defs>
        <radialGradient id="copySphere" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="35%" stopColor="#9333EA" />
          <stop offset="75%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#3B0764" />
        </radialGradient>
        <filter id="copyShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#2E1065" floodOpacity="0.7" />
        </filter>
      </defs>
      <ellipse cx="50" cy="91" rx="34" ry="7" fill="#050B17" opacity="0.45" />
      <circle cx="50" cy="48" r="40" fill="url(#copySphere)" />
      <ellipse cx="48" cy="24" rx="26" ry="12" fill="#FFFFFF" opacity="0.32" />
      <g filter="url(#copyShadow)">
        <rect x="30" y="32" width="26" height="34" rx="3" fill="#FFFFFF" />
        <line x1="35" y1="40" x2="49" y2="40" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="35" y1="46" x2="51" y2="46" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
        <line x1="35" y1="52" x2="47" y2="52" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
        <g transform="rotate(-30 58 48)">
          <path d="M55 24H61V44H55Z" fill="#FBBF24" />
          <path d="M54 44H62L58 56Z" fill="#F59E0B" />
          <line x1="58" y1="44" x2="58" y2="52" stroke="#78350F" strokeWidth="1" />
          <circle cx="58" cy="55" r="1" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );
};

export const Social3DIcon: React.FC<IconProps> = ({ className = '', size = 84 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`select-none ${className}`}>
      <defs>
        <radialGradient id="socSphere" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="35%" stopColor="#F43F5E" />
          <stop offset="75%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>
        <filter id="socShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#4C0519" floodOpacity="0.7" />
        </filter>
      </defs>
      <ellipse cx="50" cy="91" rx="34" ry="7" fill="#050B17" opacity="0.45" />
      <circle cx="50" cy="48" r="40" fill="url(#socSphere)" />
      <ellipse cx="48" cy="24" rx="26" ry="12" fill="#FFFFFF" opacity="0.32" />
      <g filter="url(#socShadow)">
        <path d="M32 34H68C72 34 75 37 75 41V55C75 59 72 62 68 62H46L36 70V62H32C28 62 25 59 25 55V41C25 37 28 34 32 34Z" fill="#FFFFFF" />
        <path d="M50 54L48 52C41 46 38 43 38 39C38 36 40 34 43 34C45 34 47 35 48 37C49 35 51 34 53 34C56 34 58 36 58 39C58 43 55 46 48 52L50 54Z" fill="#E11D48" transform="translate(2, 6) scale(0.9)" />
      </g>
    </svg>
  );
};

export const SEO3DIcon: React.FC<IconProps> = ({ className = '', size = 84 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`select-none ${className}`}>
      <defs>
        <radialGradient id="seoSphere" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="35%" stopColor="#10B981" />
          <stop offset="75%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
        <filter id="seoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#022C22" floodOpacity="0.7" />
        </filter>
      </defs>
      <ellipse cx="50" cy="91" rx="34" ry="7" fill="#050B17" opacity="0.45" />
      <circle cx="50" cy="48" r="40" fill="url(#seoSphere)" />
      <ellipse cx="48" cy="24" rx="26" ry="12" fill="#FFFFFF" opacity="0.32" />
      <g filter="url(#seoShadow)">
        <rect x="36" y="50" width="5" height="10" rx="1.5" fill="#FFFFFF" opacity="0.8" />
        <rect x="44" y="44" width="5" height="16" rx="1.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="52" y="38" width="5" height="22" rx="1.5" fill="#FFFFFF" />
        <circle cx="48" cy="46" r="16" stroke="#FFFFFF" strokeWidth="4" fill="#FFFFFF" fillOpacity="0.1" />
        <ellipse cx="45" cy="38" rx="8" ry="3" fill="#FFFFFF" opacity="0.4" />
        <path d="M59 57L71 69" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
};