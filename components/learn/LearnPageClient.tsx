'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Video,
  FileText,
  Award,
  ArrowLeft,
  Download,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  lesson_type: 'video' | 'text';
  video_key: string | null;
  text_content: string | null;
  duration_seconds: number;
  order_index: number;
  is_published: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  duration_minutes: number;
  instructor: { full_name: string | null; avatar_url: string | null } | null;
}

interface LearnPageClientProps {
  course: Course;
  lessons: Lesson[];
  progressMap: Record<string, boolean>;
  certificate: { id: string; verification_code: string } | null;
  userId: string;
}

export const LearnPageClient: React.FC<LearnPageClientProps> = ({
  course,
  lessons,
  progressMap,
  certificate,
  userId,
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(progressMap);
  const [videoRefs, setVideoRefs] = useState<Record<string, HTMLVideoElement>>({});
  const [showCertificate, setShowCertificate] = useState(false);

  // Find first incomplete lesson or last lesson
  useEffect(() => {
    const firstIncomplete = lessons.findIndex((l) => !completedLessons[l.id]);
    if (firstIncomplete !== -1) {
      setActiveLessonIndex(firstIncomplete);
    } else if (lessons.length > 0) {
      setActiveLessonIndex(lessons.length - 1);
    }
  }, [lessons, completedLessons]);

  const activeLesson = lessons[activeLessonIndex];
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const totalLessons = lessons.filter(l => l.is_published).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCourseComplete = completedCount === totalLessons && totalLessons > 0;

  const handleVideoTimeUpdate = (lessonId: string, currentTime: number, duration: number) => {
    // Auto-mark as complete when 90% watched
    if (duration > 0 && currentTime / duration >= 0.9 && !completedLessons[lessonId]) {
      markLessonComplete(lessonId);
    }
  };

  const handleVideoEnded = (lessonId: string) => {
    if (!completedLessons[lessonId]) {
      markLessonComplete(lessonId);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (completedLessons[lessonId]) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: course.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      setCompletedLessons((prev) => ({ ...prev, [lessonId]: true }));
      toast.success('Lesson completed!');

      // Check if course is complete and generate certificate
      const newCompletedCount = Object.values(completedLessons).filter(Boolean).length + 1;
      if (newCompletedCount === totalLessons && !certificate) {
        setTimeout(() => {
          generateCertificate();
        }, 1000);
      }
    } catch {
      toast.error('Failed to save progress');
    }
  };

  const generateCertificate = async () => {
    try {
      const res = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate certificate');

      toast.success('🎉 Certificate generated!');
      setShowCertificate(true);
    } catch {
      toast.error('Failed to generate certificate');
    }
  };

  const goToLesson = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setActiveLessonIndex(index);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSignedVideoUrl = async (videoKey: string) => {
    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: videoKey }),
      });
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  };

  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const videoLessons = lessons.filter((l) => l.lesson_type === 'video' && l.video_key);
    videoLessons.forEach(async (lesson) => {
      const url = await getSignedVideoUrl(lesson.video_key!);
      if (url) {
        setVideoUrls((prev) => ({ ...prev, [lesson.id]: url }));
      }
    });
  }, [lessons]);

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e0d2] sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-bold text-sm">Dashboard</span>
            </Link>

            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate max-w-md px-4">
                {course.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {isCourseComplete && certificate && (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold cursor-pointer hover:bg-amber-100 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  Certificate
                </button>
              )}
              <div className="w-40 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ddb049] to-[#20B486] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-10 text-right">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar - Lesson List */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="p-4 border-b border-[#f0ebe2]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-black text-slate-900">Course Content</h2>
                  <span className="text-xs font-bold text-slate-500">{completedCount}/{totalLessons} done</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ddb049] to-[#20B486] rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <nav className="p-3 space-y-1">
                {lessons.filter(l => l.is_published).map((lesson, index) => {
                  const isComplete = completedLessons[lesson.id];
                  const isActive = index === activeLessonIndex;
                  const isLocked = index > 0 && !completedLessons[lessons[index - 1]?.id];

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && goToLesson(index)}
                      disabled={isLocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#ddb049]/10 border border-[#ddb049]/30'
                          : isComplete
                          ? 'bg-emerald-50 hover:bg-emerald-100'
                          : 'hover:bg-[#fbfaf7]'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isComplete
                          ? 'bg-[#20B486] text-white'
                          : isActive
                          ? 'bg-[#ddb049] text-[#0a0704]'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : lesson.lesson_type === 'video' ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${
                          isActive ? 'text-slate-900' : isComplete ? 'text-emerald-700' : 'text-slate-700'
                        }`}>
                          {lesson.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          {lesson.lesson_type === 'video' ? (
                            <> <Video className="w-3 h-3" /> {formatDuration(lesson.duration_seconds)} </>
                          ) : (
                            <> <FileText className="w-3 h-3" /> ~{formatDuration(lesson.duration_seconds)} read </>
                          )}
                          {isLocked && <Lock className="w-3 h-3 text-slate-300" />}
                        </p>
                      </div>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-[#20B486] flex-shrink-0" />}
                    </button>
                  );
                })}

                {isCourseComplete && certificate && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Certificate</span>
                  </button>
                )}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Course Header (Mobile) */}
            <div className="lg:hidden bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate">{course.title}</h2>
                  <p className="text-xs text-slate-500 font-medium">{course.instructor?.full_name || 'Instructor'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                <span>{completedCount}/{totalLessons} lessons</span>
                <span>·</span>
                <span>{progressPercent}% complete</span>
              </div>
            </div>

            {/* Video/Content Player */}
            {activeLesson ? (
              <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
                {/* Lesson Header */}
                <div className="p-4 sm:p-6 border-b border-[#f0ebe2]">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-[#ddb049] border border-amber-100">
                          Lesson {activeLessonIndex + 1}
                        </span>
                        {activeLesson.lesson_type === 'video' ? (
                          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#ddb049]/10 text-[#ddb049] border border-[#ddb049]/20 flex items-center gap-1">
                            <PlayCircle className="w-2.5 h-2.5" />
                            Video
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            Reading
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                        {activeLesson.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!completedLessons[activeLesson.id] && (
                        <button
                          onClick={() => markLessonComplete(activeLesson.id)}
                          className="px-4 py-2 rounded-xl bg-[#20B486] hover:bg-[#1ea07a] text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Complete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {activeLesson.description && (
                    <p className="text-sm text-slate-600 font-medium">{activeLesson.description}</p>
                  )}
                </div>

                {/* Lesson Content */}
                <div className="p-4 sm:p-6">
                  {activeLesson.lesson_type === 'video' ? (
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative">
                      {videoUrls[activeLesson.id] ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              setVideoRefs((prev) => ({ ...prev, [activeLesson.id]: el }));
                            }
                          }}
                          src={videoUrls[activeLesson.id]}
                          controls
                          className="w-full h-full"
                          onTimeUpdate={(e) => handleVideoTimeUpdate(
                            activeLesson.id,
                            e.currentTarget.currentTime,
                            e.currentTarget.duration
                          )}
                          onEnded={() => handleVideoEnded(activeLesson.id)}
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <div className="text-center">
                            <Video className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                            <p className="text-slate-400">Video loading...</p>
                            <p className="text-xs text-slate-500 mt-1">If this persists, the video may not be available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="prose prose-slate max-w-none p-4 bg-[#fbfaf7] rounded-xl border border-[#f0ebe2]"
                      dangerouslySetInnerHTML={{ __html: activeLesson.text_content || '<p>No content available</p>' }}
                    />
                  )}

                  {/* Navigation Buttons */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#f0ebe2]">
                    <button
                      onClick={() => goToLesson(activeLessonIndex - 1)}
                      disabled={activeLessonIndex === 0}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e0d2] text-slate-700 text-sm font-bold hover:bg-[#fbfaf7] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <span>Lesson {activeLessonIndex + 1} of {totalLessons}</span>
                    </div>

                    <button
                      onClick={() => goToLesson(activeLessonIndex + 1)}
                      disabled={activeLessonIndex === lessons.filter(l => l.is_published).length - 1}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-12 text-center">
                <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">No lessons available</h3>
                <p className="text-slate-500 font-medium">This course doesn't have any published lessons yet.</p>
              </div>
            )}

            {/* Certificate Modal */}
            {showCertificate && certificate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Certificate Earned!</h3>
                    <p className="text-slate-600 font-medium mb-6">
                      Congratulations on completing <strong>{course.title}</strong>
                    </p>
                    <div className="bg-[#fbfaf7] rounded-xl p-4 mb-4 text-left">
                      <div className="text-xs font-bold text-slate-500 mb-1">Verification Code</div>
                      <div className="font-mono text-sm text-slate-900 tracking-widest">{certificate.verification_code}</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCertificate(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                      <Link
                        href={`/certificate/${certificate.verification_code}`}
                        className="flex-1 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] font-bold text-sm text-center transition-colors cursor-pointer"
                      >
                        Verify Online
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};