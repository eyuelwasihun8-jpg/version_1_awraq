'use client';

import React from 'react';
import { Play, Sparkles, TrendingUp, Users, Award } from 'lucide-react';

interface HeroSectionProps {
  onOpenConsultation?: () => void;
  onOpenSignIn?: () => void;
  videoUrl?: string; // optional hero video src
}

const TRUSTED_LOGOS = [
  { name: 'Yango', src: '/logos/yango.png' },
  { name: 'Khilx', src: '/logos/khilx.png' },
  { name: 'Green Hand', src: '/logos/green-hand.png' },
  { name: 'M', src: '/logos/m.png' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenConsultation,
  onOpenSignIn,
  videoUrl = '/videos/hero-demo.mp4',
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 pt-28 sm:pt-32 pb-16 sm:pb-20">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#07CCFD]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-[#20B486]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1) TEXT ABOVE VIDEO */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 shadow-sm backdrop-blur-md mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#07CCFD]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Practical Digital Skills
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] mb-4">
            Master Digital Marketing
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Learn digital marketing step by step and build skills you can use in your work,
            business, or personal brand.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-black shadow-[0_10px_24px_rgba(7,204,253,0.35)] transition-all cursor-pointer"
            >
              Start Learning
            </button>
            <button
              onClick={onOpenConsultation}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-white text-slate-800 text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Book Consultation
            </button>
          </div>
        </div>

        {/* 2) VIDEO FRAME WITH FLOATING CORNER ELEMENTS */}
        <div className="relative max-w-4xl mx-auto">
          {/* Floating cards / accents around video */}
          <div className="hidden md:flex absolute -left-6 top-8 z-20">
            <FloatingCard
              icon={Users}
              title="1,000+ Learners"
              subtitle="Growing every month"
              tone="cyan"
            />
          </div>

          <div className="hidden md:flex absolute -right-4 top-16 z-20">
            <FloatingCard
              icon={TrendingUp}
              title="Real Campaign Skills"
              subtitle="Ads • Content • SEO"
              tone="emerald"
            />
          </div>

          <div className="hidden md:flex absolute -left-2 bottom-16 z-20">
            <FloatingCard
              icon={Award}
              title="Certificate Ready"
              subtitle="Verified completion"
              tone="amber"
            />
          </div>

          {/* Decorative floating dots */}
          <div className="absolute -top-3 left-8 w-3 h-3 rounded-full bg-[#07CCFD]/70 blur-[1px] animate-pulse" />
          <div className="absolute top-1/3 -right-2 w-2.5 h-2.5 rounded-full bg-[#20B486]/70 animate-pulse" />
          <div className="absolute -bottom-2 left-1/3 w-2 h-2 rounded-full bg-amber-400/80" />

          {/* Video shell */}
          <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-white/80 via-[#07CCFD]/40 to-[#20B486]/30 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="relative rounded-[27px] overflow-hidden bg-slate-900 border border-white/30">
              {/* subtle top glass bar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />

              <div className="aspect-video bg-slate-900 relative">
                <video
                  className="w-full h-full object-cover"
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster="/images/hero-poster.jpg"
                />

                {/* Center play hint if no controls interaction yet */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3) TRUSTED BY under video — smaller + glassmorphism */}
          <div className="mt-5 sm:mt-6">
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap text-center sm:text-left">
                  Trusted By
                </div>

                <div className="relative overflow-hidden flex-1">
                  <div className="flex items-center gap-6 sm:gap-8 animate-marquee will-change-transform">
                    {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, i) => (
                      <div
                        key={`${logo.name}-${i}`}
                        className="shrink-0 h-8 sm:h-9 px-3 rounded-xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center shadow-sm"
                      >
                        <img
                          src={logo.src}
                          alt={logo.name}
                          className="h-5 sm:h-6 w-auto object-contain opacity-80"
                        />
                      </div>
                    ))}
                  </div>

                  {/* edge fades */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/70 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/70 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FloatingCard = ({
  icon: Icon,
  title,
  subtitle,
  tone = 'cyan',
}: {
  icon: any;
  title: string;
  subtitle: string;
  tone?: 'cyan' | 'emerald' | 'amber';
}) => {
  const tones = {
    cyan: 'from-[#07CCFD]/20 to-white/40 text-[#0891b2]',
    emerald: 'from-[#20B486]/20 to-white/40 text-[#059669]',
    amber: 'from-amber-400/20 to-white/40 text-amber-700',
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.10)] px-3.5 py-3 min-w-[170px]">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} border border-white/70 flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-black text-slate-900 leading-tight">{title}</div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};