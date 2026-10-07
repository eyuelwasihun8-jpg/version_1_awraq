'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CommunityBadge } from './CommunityBadge';
import {
  TrendingUp,
  Users,
  Award,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenConsultation?: () => void;
  onOpenSignIn?: () => void;
  videoUrl?: string;
  posterUrl?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSignIn,
  videoUrl = '/videos/hero-demo.mp4',
  posterUrl = '/hero-poster.jpg',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPoster, setCurrentPoster] = useState(posterUrl);
  const [posterFailed, setPosterFailed] = useState(false);

  // Autoplay muted on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = () => {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    };

    if (video.readyState >= 2) playVideo();
    else {
      video.addEventListener('loadeddata', playVideo, { once: true });
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [videoUrl, videoError]);

  // Track time & duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      if (!isDragging) setCurrentTime(video.currentTime || 0);
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('durationchange', onMeta);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [isDragging, videoError]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const seekFromClientX = (clientX: number) => {
    const video = videoRef.current;
    const bar = barRef.current;
    if (!video || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const t = ratio * duration;
    video.currentTime = t;
    setCurrentTime(t);
  };

  const onBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const onBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekFromClientX(e.clientX);
  };

  const onBarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePosterError = () => {
    if (currentPoster === '/hero-poster.jpg') setCurrentPoster('/images/hero-poster.jpg');
    else if (currentPoster === '/images/hero-poster.jpg') setCurrentPoster('/hero-poster.png');
    else setPosterFailed(true);
  };

  return (
    <section className="relative overflow-hidden bg-[var(--gradient-hero)] pt-28 sm:pt-32 pb-10 sm:pb-14">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#ddb049]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-96 h-96 rounded-full bg-[#ddb049]/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <FloatingCard icon={TrendingUp} title="Real Campaign Skills" subtitle="Ads • Content • SEO" />
          </div>
          <div className="hidden lg:block absolute -left-3 bottom-28 z-20 animate-floatY">
            <FloatingCard icon={Award} title="Certificate Ready" subtitle="Verified completion" />
          </div>

          <div className="absolute -top-2 left-10 w-3 h-3 rounded-full bg-[#ddb049] animate-pulse-soft" />
          <div className="absolute top-1/3 -right-1 w-2.5 h-2.5 rounded-full bg-[#ddb049]/80 animate-pulse-soft" />

          {/* Video Frame */}
          <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-[#ddb049]/60 via-[#0a0704]/20 to-[#ddb049]/40 shadow-[0_30px_80px_rgba(10,7,4,0.18)]">
            <div className="relative rounded-[27px] overflow-hidden bg-[#0a0704] border border-white/10 group">
              <div className="relative w-full aspect-video bg-[#0a0704] overflow-hidden">
                {!videoError ? (
                  <>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                      poster={!posterFailed ? currentPoster : undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      onClick={togglePlay}
                      onError={() => setVideoError(true)}
                    >
                      <source src={videoUrl} type="video/mp4" />
                    </video>

                    {/* ALWAYS VISIBLE UNMUTE / MUTE BUTTON (Top-Right) */}
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="absolute top-3 right-3 z-30 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-xl hover:scale-105"
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-4 h-4 text-amber-400" />
                          <span>Unmute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <span>Mute</span>
                        </>
                      )}
                    </button>

                    {/* PAUSED OVERLAY (Center Play Button) */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto z-20 w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl hover:scale-110"
                        aria-label="Play video"
                      >
                        <Play className="w-7 h-7 fill-current ml-1 text-[#ddb049]" />
                      </button>
                    )}

                    {/* Timeline & Controls Bar (Bottom) */}
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 sm:px-4 pt-10 pb-3">
                      {/* Timeline Bar */}
                      <div
                        ref={barRef}
                        className="relative h-2 sm:h-2.5 rounded-full bg-white/25 cursor-pointer touch-none mb-2"
                        onPointerDown={onBarPointerDown}
                        onPointerMove={onBarPointerMove}
                        onPointerUp={onBarPointerUp}
                        onPointerCancel={onBarPointerUp}
                        role="slider"
                        aria-label="Video timeline"
                        aria-valuemin={0}
                        aria-valuemax={Math.floor(duration) || 0}
                        aria-valuenow={Math.floor(currentTime) || 0}
                      >
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-[#ddb049]"
                          style={{ width: `${progressPct}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#ddb049] shadow"
                          style={{ left: `calc(${progressPct}% - 7px)` }}
                        />
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Play / Pause Toggle Button */}
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="p-1 rounded-lg text-white hover:text-[#ddb049] transition-colors cursor-pointer"
                            aria-label={isPlaying ? 'Pause video' : 'Play video'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>

                          {/* Time Counter */}
                          <div className="text-[11px] sm:text-xs font-mono font-bold text-white/90 tabular-nums">
                            {formatTime(currentTime)}
                            <span className="text-white/50"> / </span>
                            {formatTime(duration)}
                          </div>
                        </div>

                        {!isPlaying && duration > 0 && (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-sans font-bold">
                            Paused
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0">
                    {!posterFailed ? (
                      <img
                        src={currentPoster}
                        alt="Awraq course preview"
                        className="w-full h-full object-cover"
                        onError={handlePosterError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1510] to-[#0a0704] flex items-center justify-center">
                        <span className="text-sm font-black text-white">Awraq Digital Marketing</span>
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
}) => (
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