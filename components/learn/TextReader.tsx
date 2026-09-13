'use client';

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
  content: string;
  initialProgress: any;
  onCompleted: () => void;
}

export const TextReader: React.FC<Props> = ({
  lessonId,
  content,
  initialProgress,
  onCompleted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState<number>(initialProgress?.scroll_percentage || 0);
  const [timeSpent, setTimeSpent] = useState<number>(initialProgress?.time_on_page_seconds || 0);
  const completedRef = useRef<boolean>(initialProgress?.is_completed || false);

  // Reset on lesson change
  useEffect(() => {
    setScrollPct(initialProgress?.scroll_percentage || 0);
    setTimeSpent(initialProgress?.time_on_page_seconds || 0);
    completedRef.current = initialProgress?.is_completed || false;
    window.scrollTo({ top: 0 });
  }, [lessonId, initialProgress]);

  // Time tracker
  useEffect(() => {
    const interval = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll tracker
  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrolled = Math.max(0, window.scrollY - (window.scrollY + rect.top - 100));
      const totalScrollable = Math.max(1, rect.height - window.innerHeight + 200);
      const pct = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));
      setScrollPct((prev) => Math.max(prev, pct));
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Send progress every 15s + on unmount
  useEffect(() => {
    const send = async () => {
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            scrollPercentage: scrollPct,
            timeOnPageSeconds: timeSpent,
          }),
        });
        const data = await res.json();
        if (data.isCompleted && !completedRef.current) {
          completedRef.current = true;
          onCompleted();
          toast.success('Lesson completed!');
        }
      } catch {}
    };

    const interval = setInterval(send, 15000);
    return () => {
      clearInterval(interval);
      send();
    };
  }, [scrollPct, timeSpent, lessonId, onCompleted]);

  return (
    <article
      ref={containerRef}
      className="prose prose-slate max-w-none bg-white p-6 sm:p-8 lg:p-10 prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:font-medium prose-a:text-[#07CCFD] prose-strong:text-slate-900"
      dangerouslySetInnerHTML={{ __html: content || '<p>No content available.</p>' }}
    />
  );
};