'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/thumbnailCache';

interface Props {
  thumbnailKey: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean; // Set true for above-the-fold images
}

export const CourseThumbnail: React.FC<Props> = ({
  thumbnailKey,
  alt,
  className = 'w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0',
  fallbackClassName = 'w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0',
  priority = false,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErrored(false);

    if (!thumbnailKey) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    // Full URL passthrough
    if (
      thumbnailKey.startsWith('http://') ||
      thumbnailKey.startsWith('https://') ||
      thumbnailKey.startsWith('blob:')
    ) {
      setSignedUrl(thumbnailKey);
      setLoading(false);
      return;
    }

    setLoading(true);
    getThumbnailUrl(thumbnailKey).then((url) => {
      if (cancelled) return;
      setSignedUrl(url);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [thumbnailKey]);

  // No thumbnail or errored
  if (!thumbnailKey || (errored && !loading)) {
    return (
      <div className={fallbackClassName}>
        <BookOpen className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      {/* Skeleton while loading (only if no cached URL yet) */}
      {loading && !signedUrl && (
        <div className={`${fallbackClassName} animate-pulse bg-slate-200`}>
          <div className="w-6 h-6 rounded bg-slate-300" />
        </div>
      )}

      {signedUrl && (
        <img
          src={signedUrl}
          alt={alt}
          className={className}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            setErrored(true);
            setSignedUrl(null);
          }}
        />
      )}
    </>
  );
};