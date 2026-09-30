'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CommunityBadge } from './CommunityBadge';
import { TrendingUp, Users, Award, Play, VolumeX, Send } from 'lucide-react';

interface HeroSectionProps {
  onOpenConsultation?: () => void;
  onOpenSignIn?: () => void;
  videoUrl?: string;
  posterUrl?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenConsultation,
  onOpenSignIn,
  videoUrl = '/videos/hero-demo.mp4',
  posterUrl = '/images/hero-poster.jpg',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPoster, setCurrentPoster] = useState(posterUrl);
  const [posterFailed, setPosterFailed] = useState(false);

  // Try to autoplay muted on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    const t = setTimeout(tryPlay, 150);
    return () => clearTimeout(t);
  }, [videoUrl, videoError]);

  const handlePosterError = () => {
    if (currentPoster === '/images/hero-poster.jpg') {
      setCurrentPoster('/hero-poster.jpg');
    } else if (currentPoster === '/hero-poster.jpg') {
      setCurrentPoster('/hero-poster.png');
    } else if (currentPoster === '/images/hero-poster.png') {
      setCurrentPoster('/videos/hero-poster.jpg');
    } else {
      setPosterFailed(true);
    }
  };

  const handleManualPlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = true;
      await video.play();
      setIsPlaying(true);
      setVideoError(false);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[var(--gradient-hero)] pt-28 sm:pt-32 pb-10 sm:pb-14">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#ddb049]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-96 h-96 rounded-full bg-[#ddb049]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Headline */}
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
          {/* Floating cards */}
          <div className="hidden lg:block absolute -left-5 top-10 z-20 animate-floatY">
            <FloatingCard icon={Users} title="1,000+ Learners" subtitle="Growing every month" />
          </div>
          <div className="hidden lg:block absolute -right-5 top-20 z-20 animate-floatY-delayed">
            <FloatingCard
              icon={TrendingUp}
              title="Real Campaign Skills"
              subtitle="Ads • Content • SEO"
            />
          </div>
          <div className="hidden lg:block absolute -left-3 bottom-28 z-20 animate-floatY">
            <FloatingCard icon={Award} title="Certificate Ready" subtitle="Verified completion" />
          </div>

          {/* Floating dots */}
          <div className="absolute -top-2 left-10 w-3 h-3 rounded-full bg-[#ddb049] animate-pulse-soft" />
          <div className="absolute top-1/3 -right-1 w-2.5 h-2.5 rounded-full bg-[#ddb049]/80 animate-pulse-soft" />

          {/* 16:9 Frame */}
          <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-[#ddb049]/60 via-[#0a0704]/20 to-[#ddb049]/40 shadow-[0_30px_80px_rgba(10,7,4,0.18)]">
            <div className="relative rounded-[27px] overflow-hidden bg-[#0a0704] border border-white/10">
              <div className="relative w-full aspect-video bg-[#0a0704] overflow-hidden">
                {!videoError ? (
                  <>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      src={videoUrl}
                      poster={currentPoster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      controls={isPlaying}
                      style={{ objectFit: 'cover' }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => {
                        setVideoError(true);
                        setIsPlaying(false);
                      }}
                    />

                    {/* Muted badge */}
                    {isPlaying && (
                      <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white pointer-events-none">
                        <VolumeX className="w-3 h-3" />
                        Muted
                      </div>
                    )}

                    {/* Tap to play overlay if autoplay blocked */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={handleManualPlay}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/15 hover:bg-black/25 transition-colors cursor-pointer"
                        aria-label="Play video"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 text-white fill-white ml-1" />
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  /* Fallback Poster */
                  <div className="absolute inset-0">
                    {!posterFailed ? (
                      <img
                        src={currentPoster}
                        alt="Awraq course preview"
                        className="w-full h-full object-cover"
                        onError={handlePosterError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1510] to-[#0a0704] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#ddb049]/20 border border-[#ddb049]/40 flex items-center justify-center mb-3">
                          <Play className="w-7 h-7 text-[#ddb049] ml-1" />
                        </div>
                        <span className="text-sm font-black text-white">
                          Awraq Digital Marketing
                        </span>
                      </div>
                    )}

                    {!posterFailed && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                          <Play className="w-7 h-7 text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-black shadow-[0_10px_24px_rgba(221,176,73,0.4)] transition-all cursor-pointer"
            >
              Start Learning
            </button>

            <a
              href="https://t.me/AwraqHustlehub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-white border border-[#e8e0d2] hover:bg-[#fbfaf7] text-[#0a0704] text-sm font-bold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-[#0088cc]" />
              <span>Join Our Community</span>
            </a>
          </div>

          {/* Community Badge */}
          <div className="mt-5 sm:mt-6 flex justify-center">
            <CommunityBadge />
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