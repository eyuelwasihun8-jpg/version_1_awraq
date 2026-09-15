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
  const completedRef = useRef<boolean>(initialProgress?.is_completed || false);

  const sendProgress = async (pctToSend: number) => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          scrollPercentage: pctToSend,
          timeOnPageSeconds: 0,
        }),
      });
      const data = await res.json();
      if (data.isCompleted && !completedRef.current) {
        completedRef.current = true;
        onCompleted();
        toast.success('Reading complete! 📖');
      }
    } catch {}
  };

  // Reset on lesson change
  useEffect(() => {
    setScrollPct(initialProgress?.scroll_percentage || 0);
    completedRef.current = initialProgress?.is_completed || false;
    window.scrollTo({ top: 0 });
  }, [lessonId, initialProgress]);

  // AUTO-DETECT SHORT / UNSCROLLABLE TEXT
  useEffect(() => {
    const checkUnscrollable = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // If text fits entirely on screen (no scrollbar needed), 
      // mark 100% immediately because student has seen all of it!
      if (docHeight <= winHeight + 60) {
        setScrollPct(100);
        sendProgress(100);
      }
    };

    const timer = setTimeout(checkUnscrollable, 400);
    return () => clearTimeout(timer);
  }, [lessonId]);

  // Scroll listener for long text
  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // If unscrollable, force 100%
      if (docHeight <= winHeight + 60) {
        setScrollPct(100);
        return;
      }

      const scrolled = window.scrollY;
      const totalScrollable = Math.max(1, docHeight - winHeight);
      const pct = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));

      setScrollPct((prev) => {
        const next = Math.max(prev, pct);
        return next;
      });
    };

    window.addEventListener('scroll', onScroll);
    onScroll(); // initial check
    return () => window.removeEventListener('scroll', onScroll);
  }, [lessonId]);

  // Periodic progress sync
  useEffect(() => {
    const interval = setInterval(() => {
      sendProgress(scrollPct);
    }, 5000);
    return () => clearInterval(interval);
  }, [scrollPct, lessonId]);

  return (
    <article
      ref={containerRef}
      className="prose prose-slate max-w-none bg-white p-6 sm:p-8 lg:p-10 prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:font-medium prose-a:text-[#ddb049] prose-strong:text-slate-900"
      dangerouslySetInnerHTML={{ __html: content || '<p>No content available.</p>' }}
    />
  );
};