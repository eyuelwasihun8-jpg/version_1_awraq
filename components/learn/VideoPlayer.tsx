'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Loader2,
  Settings,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  lessonId: string;
  durationSeconds: number;
  initialProgress: any;
  onCompleted: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer: React.FC<Props> = ({
  courseId,
  lessonId,
  initialProgress,
  onCompleted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  // Tracking Progress State
  const watchedRef = useRef<number>(initialProgress?.watch_seconds || 0);
  const lastTimeRef = useRef<number>(0);
  const lastSentRef = useRef<number>(watchedRef.current);
  const completedRef = useRef<boolean>(initialProgress?.is_completed || false);

  useEffect(() => {
    watchedRef.current = initialProgress?.watch_seconds || 0;
    lastTimeRef.current = 0;
    lastSentRef.current = watchedRef.current;
    completedRef.current = initialProgress?.is_completed || false;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [lessonId, initialProgress]);

  // Fetch signed R2 stream URL
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setVideoUrl(null);
      try {
        const res = await fetch(`/api/video?courseId=${courseId}&lessonId=${lessonId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || 'Failed to load video stream');
          return;
        }
        setVideoUrl(data.url);
      } catch {
        if (!cancelled) setError('Network connection weak. Please retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  // Auto-refresh signed URL before 10-minute expiry
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video?courseId=${courseId}&lessonId=${lessonId}`);
        const data = await res.json();
        if (res.ok && videoRef.current) {
          const currentPos = videoRef.current.currentTime;
          const wasPlaying = !videoRef.current.paused;
          setVideoUrl(data.url);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = currentPos;
              if (wasPlaying) videoRef.current.play().catch(() => {});
            }
          }, 300);
        }
      } catch {}
    }, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, [courseId, lessonId]);

  // Event Listeners + Buffer Monitor
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const onTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);

      // Track buffer length ahead of current playback
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }

      if (current > lastTimeRef.current && current - lastTimeRef.current < 2) {
        watchedRef.current += current - lastTimeRef.current;
      }
      lastTimeRef.current = current;

      if (watchedRef.current - lastSentRef.current >= 15) {
        sendProgress();
        lastSentRef.current = watchedRef.current;
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      sendProgress();
    };

    async function sendProgress() {
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            watchSeconds: Math.floor(watchedRef.current),
          }),
        });
        const data = await res.json();
        if (data.isCompleted && !completedRef.current) {
          completedRef.current = true;
          onCompleted();
          toast.success('Lesson marked complete! 🎉');
        }
      } catch {}
    }

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      sendProgress();
    };
  }, [videoUrl, lessonId, onCompleted]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const video = videoRef.current;
      if (!video) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skip(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skip(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#ddb049]" />
        <span className="text-xs text-slate-400 font-bold">Connecting stream...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center">
        <WifiOff className="w-10 h-10 text-red-400" />
        <div className="text-sm font-bold text-white">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden bg-black shadow-2xl group select-none"
    >
      {/* Video Element with Auto-Preload */}
      <video
        ref={videoRef}
        src={videoUrl!}
        preload="auto"
        playsInline
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none">
          <Loader2 className="w-10 h-10 animate-spin text-[#ddb049]" />
          <span className="text-[11px] font-bold text-white/80">Buffering video...</span>
        </div>
      )}

      {/* Big Play Overlay */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#ddb049]/90 hover:bg-[#ddb049] hover:scale-110 text-[#0a0704] flex items-center justify-center transition-all shadow-xl cursor-pointer"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
      )}

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 transition-opacity duration-300 opacity-100 sm:opacity-0 group-hover:opacity-100">
        
        {/* Scrubber + Buffer Progress Bar */}
        <div className="relative mb-3 flex items-center group/scrub">
          {/* Grey background */}
          <div className="absolute inset-0 h-1.5 bg-white/20 rounded-lg pointer-events-none" />
          {/* Buffer loaded bar (light blue) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-lg pointer-events-none transition-all duration-300"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Actual scrubber input */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-transparent rounded-lg appearance-none cursor-pointer accent-[#ddb049] focus:outline-none relative z-10"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skip(10)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
              title="Forward 10s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#ddb049]"
              />
            </div>

            <div className="text-xs font-mono font-medium text-white/80 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Speed + Fullscreen */}
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1"
                title="Playback speed"
              >
                <Settings className="w-3 h-3" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-24 bg-slate-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden p-1 z-50">
                  <div className="text-[9px] uppercase font-black text-slate-400 px-2 py-1">Speed</div>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-[#ddb049] text-[#0a0704]'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};