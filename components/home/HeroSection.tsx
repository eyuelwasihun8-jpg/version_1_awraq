'use client';

import React from 'react';
import { TrendingUp, Users, Award } from 'lucide-react';

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
    <section className="relative overflow-hidden bg-[var(--gradient-hero)] pt-28 sm:pt-32 pb-10 sm:pb-14">
      {/* Soft Gold & Ink Ambient Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#ddb049]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-96 h-96 rounded-full bg-[#ddb049]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Headline only */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0a0704] tracking-tight leading-[1.05] mb-4">
            Master Digital Marketing
          </h1>
          <p className="text-sm sm:text-lg text-[#0a0704]/75 font-medium leading-relaxed max-w-2xl mx-auto">
            Learn digital marketing step by step and build skills you can use in your work,
            business, or personal brand.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Floating cards (Gold accents) */}
          <div className="hidden lg:block absolute -left-5 top-10 z-20 animate-floatY">
            <FloatingCard icon={Users} title="1,000+ Learners" subtitle="Growing every month" />
          </div>
          <div className="hidden lg:block absolute -right-5 top-20 z-20 animate-floatY-delayed">
            <FloatingCard icon={TrendingUp} title="Real Campaign Skills" subtitle="Ads • Content • SEO" />
          </div>
          <div className="hidden lg:block absolute -left-3 bottom-28 z-20 animate-floatY">
            <FloatingCard icon={Award} title="Certificate Ready" subtitle="Verified completion" />
          </div>

          {/* Floating dots */}
          <div className="absolute -top-2 left-10 w-3 h-3 rounded-full bg-[#ddb049] animate-pulse-soft" />
          <div className="absolute top-1/3 -right-1 w-2.5 h-2.5 rounded-full bg-[#ddb049]/80 animate-pulse-soft" />

          {/* Video Frame with Gold Border Glow */}
          <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-[#ddb049]/60 via-[#0a0704]/20 to-[#ddb049]/40 shadow-[0_30px_80px_rgba(10,7,4,0.18)]">
            <div className="relative rounded-[27px] overflow-hidden bg-[#0a0704] border border-white/10">
              <div className="aspect-video bg-[#0a0704] relative">
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

          {/* GOLD & INK ACTION BUTTONS */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-black shadow-[0_10px_24px_rgba(221,176,73,0.4)] transition-all cursor-pointer"
            >
              Start Learning
            </button>
            <button
              onClick={onOpenConsultation}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-white border border-[#e8e0d2] hover:bg-[#fbfaf7] text-[#0a0704] text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Book Consultation
            </button>
          </div>

          {/* Ink Community pill */}
          <div className="mt-5 sm:mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-[#0a0704] text-white pl-2 pr-5 py-2 shadow-xl border border-white/10">
              <div className="flex -space-x-2">
                {COMMUNITY_AVATARS.map((src, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0a0704] overflow-hidden bg-slate-800"
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
                Join our <span className="text-[#ddb049]">1000+</span> community
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
}: {
  icon: any;
  title: string;
  subtitle: string;
}) => {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_rgba(10,7,4,0.12)] px-3.5 py-3 min-w-[170px]">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#ddb049]/20 text-[#0a0704] border border-[#ddb049]/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#b8862f]" />
        </div>
        <div>
          <div className="text-xs font-black text-[#0a0704] leading-tight">{title}</div>
          <div className="text-[10px] font-bold text-[#0a0704]/60 leading-tight">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};