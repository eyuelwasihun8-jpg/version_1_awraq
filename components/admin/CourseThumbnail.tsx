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

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

/**
 * Synchronously constructs the full R2 public URL on initial render.
 * Eliminates client-side API fetch delays!
 */
function resolveThumbnailUrl(key?: string | null): string | null {
  if (!key || !key.trim()) return null;

  const cleanKey = key.trim();

  // 1. Direct HTTP URL
  if (/^https?:\/\//i.test(cleanKey)) {
    return cleanKey;
  }

  // 2. Fast synchronous resolution if public R2 domain exists
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${cleanKey.replace(/^\//, '')}`;
  }

  // 3. In-memory cache check
  return getCachedThumbnail(cleanKey);
}

export const CourseThumbnail: React.FC<Props> = ({
  thumbnailKey,
  alt,
  className = 'w-16 h-12 rounded-lg object-cover',
  fallbackClassName = 'w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center',
  priority = false,
}) => {
  // Initialize state synchronously so <img> renders immediately in HTML
  const initialUrl = resolveThumbnailUrl(thumbnailKey);
  const [src, setSrc] = useState<string | null>(initialUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);

    if (!thumbnailKey) {
      setSrc(null);
      return;
    }

    const resolved = resolveThumbnailUrl(thumbnailKey);
    if (resolved) {
      setSrc(resolved);
      return;
    }

    // Fallback API call ONLY if public R2 domain is missing in environment
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
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};