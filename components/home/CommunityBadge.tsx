'use client';

import React, { useState } from 'react';

export const CommunityBadge: React.FC = () => {
  const [failedAvatars, setFailedAvatars] = useState<Record<number, boolean>>({});

  const avatars = [
    '/avatars/1.jpg',
    '/avatars/2.jpg',
    '/avatars/3.jpg',
    '/avatars/4.jpg',
    '/avatars/5.jpg',
  ];

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black text-white text-xs font-bold border border-white/10 shadow-lg select-none">
      <div className="flex -space-x-2 overflow-hidden">
        {avatars.map((src, i) =>
          failedAvatars[i] ? (
            <div
              key={i}
              className="inline-block h-6 w-6 rounded-full bg-[#ddb049] ring-2 ring-black flex items-center justify-center text-[9px] font-black text-black shrink-0"
            >
              A
            </div>
          ) : (
            <img
              key={i}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-black object-cover shrink-0"
              src={src}
              alt=""
              loading="eager"
              decoding="async"
              onError={() => setFailedAvatars((prev) => ({ ...prev, [i]: true }))}
            />
          )
        )}
      </div>
      <span>
        Join our <strong className="text-[#ddb049]">1,000+</strong> community
      </span>
    </div>
  );
};