'use client';

import React, { useState } from 'react';
import { Play, Quote, X, Star } from 'lucide-react';

type TestimonialItem = {
  id: string;
  name: string;
  role: string;
  type: 'video' | 'image';
  src: string; // video url or image url
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
];

export const TestimonialsMediaSection: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<TestimonialItem | null>(null);

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
      <div className="pointer-events-none absolute top-10 left-10 w-40 h-40 rounded-full bg-[#07CCFD]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-52 h-52 rounded-full bg-[#20B486]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#07CCFD] mb-2">
            Student Stories
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-3">
            Real Results from Real Learners
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Watch and read testimonials from students who applied what they learned.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-3xl overflow-hidden border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] transition-all"
            >
              <div className="aspect-[4/5] relative bg-slate-100">
                {item.type === 'video' ? (
                  <>
                    <img
                      src={item.poster || item.src}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setActiveVideo(item)}
                      className="absolute inset-0 flex items-center justify-center bg-slate-900/20 hover:bg-slate-900/30 transition-colors cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                      </div>
                    </button>
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-white backdrop-blur-md border border-white/20">
                      Video
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/50 text-slate-800 backdrop-blur-md border border-white/60">
                      Story
                    </div>
                  </>
                )}

                {/* bottom glass info */}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="rounded-2xl border border-white/50 bg-white/45 backdrop-blur-xl p-3 shadow-sm">
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
                    <div className="text-sm font-black text-slate-900 leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                      {item.role}
                    </div>
                    {item.quote && (
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed line-clamp-2">
                        “{item.quote}”
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <video
              src={activeVideo.src}
              poster={activeVideo.poster}
              controls
              autoPlay
              className="w-full aspect-video"
            />
            <div className="p-4 bg-slate-950 text-white">
              <div className="text-sm font-black">{activeVideo.name}</div>
              <div className="text-xs text-white/60 font-medium">{activeVideo.role}</div>
              {activeVideo.quote && (
                <p className="text-xs text-white/80 mt-2 font-medium flex gap-2">
                  <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#07CCFD]" />
                  {activeVideo.quote}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};