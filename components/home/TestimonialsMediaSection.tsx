'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Quote, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

type TestimonialItem = {
  id: string;
  name: string;
  role: string;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  quote?: string;
  rating?: number;
};

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Sara Kebede',
    role: 'Social Media Manager',
    type: 'video',
    src: '/videos/testimonials/sara.mp4',
    poster: '/images/testimonials/sara.jpg',
    quote: 'I landed freelance clients within 3 weeks of finishing the course.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Nahom Solomon',
    role: 'Business Owner',
    type: 'image',
    src: '/images/testimonials/nahom.jpg',
    quote: 'Clear lessons. Practical strategy. My ads finally made sense.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Mahlet Tesfaye',
    role: 'Content Creator',
    type: 'video',
    src: '/videos/testimonials/mahlet.mp4',
    poster: '/images/testimonials/mahlet.jpg',
    quote: 'The step-by-step system helped me grow my personal brand fast.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Abebe Kebede',
    role: 'Marketing Intern',
    type: 'image',
    src: '/images/testimonials/abebe.jpg',
    quote: 'Best practical digital marketing training I have taken.',
    rating: 4,
  },
  {
    id: '5',
    name: 'Hanna Alemu',
    role: 'Freelance Marketer',
    type: 'image',
    src: '/images/testimonials/hanna.jpg',
    quote: 'I finally understood ads, funnels, and content in one place.',
    rating: 5,
  },
  {
    id: '6',
    name: 'Yonas Bekele',
    role: 'Startup Founder',
    type: 'video',
    src: '/videos/testimonials/yonas.mp4',
    poster: '/images/testimonials/yonas.jpg',
    quote: 'We applied the lessons and saw better lead quality immediately.',
    rating: 5,
  },
];

export const TestimonialsMediaSection: React.FC = () => {
  const [activeItem, setActiveItem] = useState<TestimonialItem | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Mobile carousel state
  const [mobileIndex, setMobileIndex] = useState(0);
  const [pausedMobile, setPausedMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Detect desktop vs mobile
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Mobile auto-rotate every 3s
  useEffect(() => {
    if (isDesktop || pausedMobile || activeItem) return;
    const t = setInterval(() => {
      setMobileIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 3000);
    return () => clearInterval(t);
  }, [isDesktop, pausedMobile, activeItem, TESTIMONIALS.length]);

  const openItem = (item: TestimonialItem) => setActiveItem(item);
  const closeItem = () => setActiveItem(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setPausedMobile(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    const delta = touchDeltaX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        setMobileIndex((i) => (i + 1) % TESTIMONIALS.length);
      } else {
        setMobileIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    // resume autoplay shortly after interaction
    setTimeout(() => setPausedMobile(false), 1200);
  };

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
      <div className="pointer-events-none absolute top-10 left-10 w-40 h-40 rounded-full bg-[#ddb049]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-52 h-52 rounded-full bg-[#20B486]/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ddb049] mb-2">
            Student Stories
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-3">
            Real Results from Real Learners
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Watch and read testimonials from students who applied what they learned.
          </p>
        </div>

        {/* ═══════════════ DESKTOP: horizontal marquee ═══════════════ */}
        <div className="hidden lg:block relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10" />

          <div className="overflow-hidden group/marquee">
            <div className="flex gap-5 w-max animate-testimonials-marquee group-hover/marquee:[animation-play-state:paused] py-2">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="w-[280px] shrink-0">
                  <TestimonialCard item={item} onOpen={() => openItem(item)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════ MOBILE/TABLET: carousel ═══════════════ */}
        <div className="lg:hidden">
          <div
            className="relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseEnter={() => setPausedMobile(true)}
            onMouseLeave={() => setPausedMobile(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
            >
              {TESTIMONIALS.map((item) => (
                <div key={item.id} className="w-full shrink-0 px-1">
                  <div className="max-w-sm mx-auto">
                    <TestimonialCard item={item} onOpen={() => openItem(item)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPausedMobile(true);
                setMobileIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
                setTimeout(() => setPausedMobile(false), 1500);
              }}
              className="w-10 h-10 rounded-full bg-white border border-[#e8e0d2] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#fbfaf7]"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>

            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMobileIndex(i);
                    setPausedMobile(true);
                    setTimeout(() => setPausedMobile(false), 1500);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === mobileIndex ? 'w-6 bg-[#ddb049]' : 'w-2 bg-slate-300'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                setPausedMobile(true);
                setMobileIndex((i) => (i + 1) % TESTIMONIALS.length);
                setTimeout(() => setPausedMobile(false), 1500);
              }}
              className="w-10 h-10 rounded-full bg-white border border-[#e8e0d2] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#fbfaf7]"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / player modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeItem}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeItem}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {activeItem.type === 'video' ? (
              <video
                src={activeItem.src}
                poster={activeItem.poster}
                controls
                autoPlay
                playsInline
                className="w-full aspect-video bg-black"
              />
            ) : (
              <div className="w-full bg-slate-900 flex items-center justify-center">
                <img
                  src={activeItem.src}
                  alt={activeItem.name}
                  className="w-full max-h-[75vh] object-contain"
                />
              </div>
            )}

            <div className="p-4 bg-slate-950 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{activeItem.name}</div>
                  <div className="text-xs text-white/60 font-medium">{activeItem.role}</div>
                </div>
                {activeItem.rating && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (activeItem.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {activeItem.quote && (
                <p className="text-xs text-white/80 mt-2 font-medium flex gap-2">
                  <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#ddb049]" />
                  {activeItem.quote}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ─── Card ─── */
const TestimonialCard = ({
  item,
  onOpen,
}: {
  item: TestimonialItem;
  onOpen: () => void;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const mediaSrc = item.type === 'video' ? item.poster || item.src : item.src;

  return (
    <article
      className="group relative rounded-3xl overflow-hidden border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)] transition-all cursor-pointer h-full"
      onClick={onOpen}
    >
      <div className="aspect-[4/5] relative bg-slate-200">
        {!imgFailed ? (
          <img
            src={mediaSrc}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
        )}

        {/* type badge */}
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
            item.type === 'video'
              ? 'bg-black/45 text-white border-white/20'
              : 'bg-white/70 text-slate-800 border-white/60'
          }`}
        >
          {item.type === 'video' ? 'Video' : 'Story'}
        </div>

        {/* play affordance for video */}
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/15 group-hover:bg-slate-900/25 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* bottom info glass */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur-xl p-3 shadow-sm">
            {item.rating && (
              <div className="flex items-center gap-0.5 mb-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < (item.rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}
            <div className="text-sm font-black text-slate-900 leading-tight">{item.name}</div>
            <div className="text-[11px] font-bold text-slate-600 mb-1.5">{item.role}</div>
            {item.quote && (
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed line-clamp-2">
                “{item.quote}”
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};