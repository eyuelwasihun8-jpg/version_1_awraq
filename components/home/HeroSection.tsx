'use client';

import React from 'react';
import {
  Play,
  Sparkles,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenConsultation?: () => void;
  onOpenSignIn?: () => void;
  videoUrl?: string;
}

const COMMUNITY_AVATARS = [
  '/images/community/1.jpg',
  '/images/community/2.jpg',
  '/images/community/3.jpg',
  '/images/community/4.jpg',
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenConsultation,
  onOpenSignIn,
  videoUrl = '/videos/hero-demo.mp4',
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-28 sm:pt-32 pb-10 sm:pb-14">
      {/* Soft ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#07CCFD]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-[#20B486]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* TEXT ABOVE VIDEO */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
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
        </div>

        {/* VIDEO + FLOATING SIDE CARDS */}
        <div className="relative max-w-4xl mx-auto">
          {/* Floating cards */}
          <div className="hidden lg:block absolute -left-5 top-10 z-20 animate-floatY">
            <FloatingCard
              icon={Users}
              title="1,000+ Learners"
              subtitle="Growing every month"
              tone="cyan"
            />
          </div>

          <div className="hidden lg:block absolute -right-5 top-20 z-20 animate-floatY-delayed">
            <FloatingCard
              icon={TrendingUp}
              title="Real Campaign Skills"
              subtitle="Ads • Content • SEO"
              tone="emerald"
            />
          </div>

          <div className="hidden lg:block absolute -left-3 bottom-28 z-20 animate-floatY">
            <FloatingCard
              icon={Award}
              title="Certificate Ready"
              subtitle="Verified completion"
              tone="amber"
            />
          </div>

          {/* Floating dots */}
          <div className="absolute -top-2 left-10 w-3 h-3 rounded-full bg-[#07CCFD] animate-pulse-soft" />
          <div className="absolute top-1/3 -right-1 w-2.5 h-2.5 rounded-full bg-[#20B486] animate-pulse-soft" />

          {/* Video frame */}
          <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-slate-200 via-[#07CCFD]/50 to-[#20B486]/40 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
            <div className="relative rounded-[27px] overflow-hidden bg-slate-900 border border-white/20">
              <div className="aspect-video bg-slate-900 relative">
                <video
                  className="w-full h-full object-cover"
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster="/images/hero-poster.jpg"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS — directly under video */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-black shadow-[0_10px_24px_rgba(7,204,253,0.35)] transition-all cursor-pointer"
            >
              Start Learning
            </button>
            <button
              onClick={onOpenConsultation}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Book Consultation
            </button>
          </div>

          {/* Community strip — between buttons and Trusted By */}
          <div className="mt-5 sm:mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-slate-950 text-white pl-2 pr-5 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.25)]">
              <div className="flex -space-x-2">
                {COMMUNITY_AVATARS.map((src, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-700"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white/90">
                Join our <span className="text-white">1000+</span> community
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
    cyan: 'bg-[#07CCFD]/15 text-[#0891b2]',
    emerald: 'bg-[#20B486]/15 text-[#059669]',
    amber: 'bg-amber-400/15 text-amber-700',
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.10)] px-3.5 py-3 min-w-[170px]">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl ${tones[tone]} border border-white/70 flex items-center justify-center`}
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