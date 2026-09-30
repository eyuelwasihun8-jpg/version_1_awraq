'use client';

import React, { useEffect, useState } from 'react';

// Built-in crisp vector avatars (never fail, zero network delay)
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
];

export function CommunityBadge() {
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/avatars')
      .then((res) => res.json())
      .then((data) => {
        if (data.avatars && data.avatars.length > 0) {
          setAvatars(data.avatars);
        } else {
          setAvatars(DEFAULT_AVATARS);
        }
      })
      .catch(() => setAvatars(DEFAULT_AVATARS));
  }, []);

  const listToRender = avatars.length > 0 ? avatars : DEFAULT_AVATARS;

  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#0a0704] text-white shadow-xl border border-white/10 select-none">
      {/* Overlapping Avatar Stack */}
      <div className="flex -space-x-2.5 overflow-visible items-center">
        {listToRender.map((src, i) => (
          <AvatarItem key={src + i} src={src} index={i} total={listToRender.length} />
        ))}
      </div>

      <span className="text-xs sm:text-sm font-medium text-slate-200 pr-1">
        Join our <strong className="text-[#ddb049] font-black">1000+</strong> community
      </span>
    </div>
  );
}

function AvatarItem({ src, index, total }: { src: string; index: number; total: number }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={`Community member ${index + 1}`}
      className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-[#0a0704] object-cover bg-slate-800 shrink-0"
      style={{ zIndex: total - index }}
      onError={() => {
        // If local image fails, swap to reliable fallback photo
        if (DEFAULT_AVATARS[index % DEFAULT_AVATARS.length]) {
          setImgSrc(DEFAULT_AVATARS[index % DEFAULT_AVATARS.length]);
        }
      }}
    />
  );
}