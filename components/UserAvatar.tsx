'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface Props {
  avatarKey: string | null | undefined;
  name: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

export const UserAvatar: React.FC<Props> = ({ avatarKey, name, size = 'md', className = '' }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!avatarKey) {
      setSignedUrl(null);
      return;
    }

    // Already a full URL (e.g. from Google OAuth)
    if (
      avatarKey.startsWith('http://') ||
      avatarKey.startsWith('https://') ||
      avatarKey.startsWith('blob:')
    ) {
      setSignedUrl(avatarKey);
      return;
    }

    setLoading(true);
    fetch(`/api/thumbnail?key=${encodeURIComponent(avatarKey)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setSignedUrl(data.url);
        else setSignedUrl(null);
      })
      .catch(() => setSignedUrl(null))
      .finally(() => setLoading(false));
  }, [avatarKey]);

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  const baseClass = `${SIZES[size]} rounded-full flex items-center justify-center shrink-0 overflow-hidden ${className}`;

  if (signedUrl) {
    return (
      <div className={`${baseClass} bg-slate-200`}>
        <img
          src={signedUrl}
          alt={name || 'User'}
          className="w-full h-full object-cover"
          onError={() => setSignedUrl(null)}
        />
      </div>
    );
  }

  if (loading) {
    return <div className={`${baseClass} bg-slate-200 animate-pulse`} />;
  }

  if (initials) {
    return (
      <div className={`${baseClass} bg-gradient-to-br from-[#ddb049] to-[#20B486] text-white font-black`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${baseClass} bg-slate-200 text-slate-500`}>
      <User className={ICON_SIZES[size]} />
    </div>
  );
};