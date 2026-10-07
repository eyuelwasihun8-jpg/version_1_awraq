'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { getCachedThumbnail, cacheThumbnail } from '@/lib/thumbnailCache';

interface Props {
  thumbnailKey?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

export const CourseThumbnail: React.FC<Props> = ({
  thumbnailKey,
  alt,
  className = 'w-16 h-12 rounded-lg object-cover',
  fallbackClassName = 'w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center',
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);

    if (!thumbnailKey) {
      setSrc(null);
      return;
    }

    // Direct HTTP URL
    if (/^https?:\/\//i.test(thumbnailKey)) {
      setSrc(thumbnailKey);
      return;
    }

    // Check in-memory cache
    const cached = getCachedThumbnail(thumbnailKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    let isMounted = true;
    fetch(`/api/thumbnail?key=${encodeURIComponent(thumbnailKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.url) {
          cacheThumbnail(thumbnailKey, data.url);
          setSrc(data.url);
        }
      })
      .catch(() => {
        if (isMounted) setFailed(true);
      });

    return () => {
      isMounted = false;
    };
  }, [thumbnailKey]);

  if (!thumbnailKey || failed || !src) {
    return (
      <div className={fallbackClassName}>
        <BookOpen className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};