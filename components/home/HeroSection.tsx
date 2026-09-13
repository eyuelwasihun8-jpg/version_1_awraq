'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useModals } from '@/components/RootLayoutClient';

const COMMUNITY_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
];

const HERO_STATS = [
  { value: '3+ Years', label: 'Experience' },
  { value: '1000+', label: 'Community' },
  { value: '35+', label: 'Projects' },
  { value: '96%', label: 'Satisfaction' },
];

export const HeroSection: React.FC = () => {
  const { openConsultation } = useModals();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handlePlayClick = () => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const scrollToCourses = () => {
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20 overflow-hidden z-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* AUTOPLAY VIDEO */}
        <div className="relative w-full mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 aspect-video group">
          <video
            ref={videoRef}
            src="/hero-intro.mp4"
            poster="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

          {!isPlaying && (
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
              aria-label="Play video"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/95 hover:bg-white text-[#0F172A] rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xl">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 fill-current ml-1" />
              </div>
            </button>
          )}

          <button
            onClick={toggleMute}
            className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center z-20 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg z-10">
            <Sparkles className="w-3.5 h-3.5 text-[#FFCD00]" />
            <span>AWRAQ</span>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center mt-10 sm:mt-14 space-y-5 sm:space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
            Master Digital{' '}
            <span className="bg-gradient-to-r from-[#07CCFD] via-[#3080E0] to-[#20B486] bg-clip-text text-transparent">
              Marketing
            </span>
          </h1>

          <p className="text-slate-600 font-medium text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-2">
            Learn digital marketing step by step and build skills you can use in your work,
            business, or personal brand.
          </p>

          {/* COMMUNITY AVATARS */}
          <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex -space-x-2 sm:-space-x-3">
              {COMMUNITY_AVATARS.map((avatar, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden shadow"
                >
                  <img
                    src={avatar}
                    alt={`Community member ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <span className="text-slate-800 text-xs sm:text-base font-bold">
              Join our 1,000+ community
            </span>
          </div>

          {/* STATS */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-5 pt-6 mt-4 border-t border-slate-200 max-w-3xl mx-auto">
            {HERO_STATS.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-x-6 sm:gap-x-8">
                {idx !== 0 && (
                  <span
                    className="hidden sm:block w-px h-9 bg-slate-200"
                    aria-hidden="true"
                  ></span>
                )}
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-xs lg:text-sm font-semibold text-slate-500 mt-1.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 px-4">
            <button
              onClick={scrollToCourses}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-[#07CCFD] hover:bg-[#06b8e4] text-[#0F172A] text-base font-black shadow-[0_10px_30px_rgba(7,204,253,0.3)] border-b-[5px] border-[#05a3ca] hover:border-b-[2px] hover:translate-y-[3px] transition-all cursor-pointer"
            >
              Start Learning
            </button>

            <button
              onClick={openConsultation}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-base font-bold shadow-sm border border-slate-200 transition-all cursor-pointer"
            >
              Book a Consultation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};