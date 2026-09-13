'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  CheckCircle2,
  Video,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { TextReader } from './TextReader';
import { QuizPlayer } from './QuizPlayer';
import { LessonSidebar } from './LessonSidebar';

interface Props {
  course: any;
  lesson: any;
  modules: any[];
  allLessons: any[];
  allProgress: any[];
  prevLesson: any | null;
  nextLesson: any | null;
  initialProgress: any;
  lessonNumber: number;
}

export const LessonClient: React.FC<Props> = ({
  course,
  lesson,
  modules,
  allLessons,
  allProgress,
  prevLesson,
  nextLesson,
  initialProgress,
  lessonNumber,
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progressState, setProgressState] = useState(allProgress);

  const completedIds = new Set(
    progressState.filter((p) => p.is_completed).map((p) => p.lesson_id)
  );
  const completedCount = completedIds.size;
  const totalCount = allLessons.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleLessonComplete = () => {
    setProgressState((prev) => {
      const existing = prev.find((p) => p.lesson_id === lesson.id);
      if (existing) {
        return prev.map((p) =>
          p.lesson_id === lesson.id ? { ...p, is_completed: true } : p
        );
      }
      return [...prev, { lesson_id: lesson.id, is_completed: true }];
    });
  };

  const hasVideo = !!(lesson.video_key && String(lesson.video_key).trim());
  const hasText = !!(
    lesson.text_content &&
    String(lesson.text_content).replace(/<[^>]*>/g, '').trim().length > 0
  );
  const hasQuiz = !!(
    lesson.quiz_data?.questions && lesson.quiz_data.questions.length > 0
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* TOP HEADER */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Link
            href={`/learn/${course.id}`}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Back to course"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black truncate">{course.title}</h1>
            <div className="flex items-center gap-2 text-[11px] text-white/60 font-medium">
              <span>
                {completedCount} of {totalCount} lessons
              </span>
              <span>·</span>
              <span className="text-[#07CCFD] font-bold">{percentage}% complete</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24 lg:w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#07CCFD] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-black">
            {completedCount}/{totalCount}
          </span>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        <LessonSidebar
          course={course}
          modules={modules}
          currentLessonId={lesson.id}
          completedIds={completedIds}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 overflow-y-auto">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-[76px] left-4 z-20 w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-all"
              title="Show sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="relative">
              {/* Desktop side arrows */}
              {prevLesson && (
                <button
                  onClick={() =>
                    router.push(`/learn/${course.id}/${prevLesson.id}`)
                  }
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center hover:bg-slate-50 cursor-pointer transition-all z-10 group"
                  title={`Previous: ${prevLesson.title}`}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700 group-hover:text-[#07CCFD]" />
                </button>
              )}

              {nextLesson && (
                <button
                  onClick={() =>
                    router.push(`/learn/${course.id}/${nextLesson.id}`)
                  }
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center hover:bg-slate-50 cursor-pointer transition-all z-10 group"
                  title={`Next: ${nextLesson.title}`}
                >
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-[#07CCFD]" />
                </button>
              )}

              {/* CONTENT SECTIONS */}
              <div className="space-y-6">
                {hasVideo && (
                  <div>
                    <SectionLabel icon={Video} label="Video Lesson" color="cyan" />
                    <div className="rounded-2xl overflow-hidden shadow-lg bg-black">
                      <VideoPlayer
                        courseId={course.id}
                        lessonId={lesson.id}
                        durationSeconds={lesson.duration_seconds || 0}
                        initialProgress={initialProgress}
                        onCompleted={handleLessonComplete}
                      />
                    </div>
                  </div>
                )}

                {hasText && (
                  <div>
                    <SectionLabel
                      icon={FileText}
                      label="Reading Material"
                      color="emerald"
                    />
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                      <TextReader
                        lessonId={lesson.id}
                        content={lesson.text_content || ''}
                        initialProgress={initialProgress}
                        onCompleted={handleLessonComplete}
                      />
                    </div>
                  </div>
                )}

                {hasQuiz && (
                  <div>
                    <SectionLabel
                      icon={HelpCircle}
                      label="Practice Quiz"
                      color="purple"
                    />
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                      <QuizPlayer
                        lessonId={lesson.id}
                        quizData={lesson.quiz_data}
                        onCompleted={handleLessonComplete}
                      />
                    </div>
                  </div>
                )}

                {!hasVideo && !hasText && !hasQuiz && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                      No content in this lesson yet
                    </p>
                  </div>
                )}
              </div>

              {/* Meta below content */}
              <div className="mt-8 pb-2">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <div className="text-[11px] uppercase font-black tracking-widest text-[#07CCFD]">
                    Lesson {lessonNumber}
                  </div>

                  {hasVideo && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                      Video
                    </span>
                  )}
                  {hasText && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Text
                    </span>
                  )}
                  {hasQuiz && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      Quiz
                    </span>
                  )}

                  {completedIds.has(lesson.id) && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {lesson.title}
                </h2>
              </div>

              {/* NEXT / PREV NAVIGATION (BOTTOM - VISIBLE ALWAYS) */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-slate-200 pt-6">
                {prevLesson ? (
                  <Link
                    href={`/learn/${course.id}/${prevLesson.id}`}
                    className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-[#07CCFD] cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-cyan-50">
                      <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#07CCFD]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">
                        Previous Lesson
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate group-hover:text-[#07CCFD]">
                        {prevLesson.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block flex-1" />
                )}

                {nextLesson ? (
                  <Link
                    href={`/learn/${course.id}/${nextLesson.id}`}
                    className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 cursor-pointer transition-all group shadow-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">
                        Next Lesson
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {nextLesson.title}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#07CCFD] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-5 h-5 text-slate-900" />
                    </div>
                  </Link>
                ) : (
                  <Link
                    href={`/learn/${course.id}`}
                    className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#20B486] to-[#059669] cursor-pointer transition-all group shadow-[0_8px_20px_rgba(32,180,134,0.3)] hover:-translate-y-0.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black text-emerald-100 tracking-wider mb-0.5">
                        Course Complete
                      </div>
                      <div className="text-sm font-bold text-white">Back to Overview</div>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({
  icon: Icon,
  label,
  color,
}: {
  icon: any;
  label: string;
  color: 'cyan' | 'emerald' | 'purple';
}) => {
  const colors = {
    cyan: 'text-[#07CCFD]',
    emerald: 'text-[#20B486]',
    purple: 'text-purple-600',
  };
  return (
    <div className="flex items-center gap-1.5 mb-2 pl-1">
      <Icon className={`w-3.5 h-3.5 ${colors[color]}`} />
      <span
        className={`text-[10px] uppercase font-black tracking-widest ${colors[color]}`}
      >
        {label}
      </span>
    </div>
  );
};