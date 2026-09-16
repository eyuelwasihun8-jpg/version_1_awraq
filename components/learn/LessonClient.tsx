'use client';

import React, { useState, useEffect } from 'react';
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
  Award,
  List,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Circle,
  Play,
  ExternalLink,
  Download,
  Loader2,
  Save,
  StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  // Is this the last lesson AND is the entire course fully completed?
  const isLastLesson = !nextLesson;
  const courseFullyCompleted = totalCount > 0 && completedCount === totalCount;
  const showCertificateButton = isLastLesson && courseFullyCompleted;

  // Mobile sidebar tabs
  const [mobileTab, setMobileTab] = useState<'outline' | 'resources' | 'notes'>('outline');

  // Get current lesson title for mobile sidebar
  let currentLessonTitle = '';
  for (const m of modules) {
    const l = (m.lessons || []).find((x: any) => x.id === lesson.id);
    if (l) {
      currentLessonTitle = l.title;
      break;
    }
  }

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
              <span className="text-[#ddb049] font-bold">{percentage}% complete</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24 lg:w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ddb049] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-black">
            {completedCount}/{totalCount}
          </span>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
            title="Open course outline"
            aria-label="Open course outline"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden bg-[#fbfaf7]">
        <LessonSidebar
          course={course}
          modules={modules}
          currentLessonId={lesson.id}
          completedIds={completedIds}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 overflow-y-auto relative">
          {!sidebarOpen && !mobileSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-[76px] left-4 z-20 w-11 h-11 rounded-xl bg-white border border-[#e8e0d2] shadow-md flex items-center justify-center hover:bg-[#fbfaf7] cursor-pointer transition-all lg:hidden"
              title="Show sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {/* Mobile Sidebar Overlay */}
          {mobileSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] max-w-[90vw] bg-white z-50 lg:hidden flex flex-col shadow-2xl animate-slideIn">
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b border-[#e8e0d2] flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-0.5">
                      Course
                    </div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight truncate">{course.title}</h2>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                    title="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Tabs */}
                <div className="flex border-b border-[#f0ebe2] bg-white">
                  <MobileTabButton
                    active={mobileTab === 'outline'}
                    onClick={() => setMobileTab('outline')}
                    icon={List}
                    label="Outline"
                  />
                  <MobileTabButton
                    active={mobileTab === 'resources'}
                    onClick={() => setMobileTab('resources')}
                    icon={FileText}
                    label="Resources"
                  />
                  <MobileTabButton
                    active={mobileTab === 'notes'}
                    onClick={() => setMobileTab('notes')}
                    icon={HelpCircle}
                    label="Notes"
                  />
                </div>

                {/* Mobile Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {mobileTab === 'outline' && (
                    <MobileOutlineTab
                      course={course}
                      modules={modules}
                      completedIds={completedIds}
                      currentLessonId={lesson.id}
                      onLessonClick={() => setMobileSidebarOpen(false)}
                    />
                  )}
                  {mobileTab === 'resources' && (
                    <MobileResourcesTab lessonId={lesson.id} lessonTitle={currentLessonTitle} />
                  )}
                  {mobileTab === 'notes' && (
                    <MobileNotesTab
                      courseId={course.id}
                      lessonId={lesson.id}
                      lessonTitle={currentLessonTitle}
                    />
                  )}
                </div>
              </aside>
            </>
          )}

          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="relative">
              {/* Desktop side arrows */}
              {prevLesson && (
                <button
                  onClick={() =>
                    router.push(`/learn/${course.id}/${prevLesson.id}`)
                  }
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 rounded-full bg-white border border-[#e8e0d2] shadow-lg items-center justify-center hover:bg-[#fbfaf7] cursor-pointer transition-all z-10 group"
                  title={`Previous: ${prevLesson.title}`}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700 group-hover:text-[#ddb049]" />
                </button>
              )}

              {nextLesson && (
                <button
                  onClick={() =>
                    router.push(`/learn/${course.id}/${nextLesson.id}`)
                  }
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 rounded-full bg-white border border-[#e8e0d2] shadow-lg items-center justify-center hover:bg-[#fbfaf7] cursor-pointer transition-all z-10 group"
                  title={`Next: ${nextLesson.title}`}
                >
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-[#ddb049]" />
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
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-[#e8e0d2] bg-white">
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
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-[#e8e0d2] bg-white">
                      <QuizPlayer
                        lessonId={lesson.id}
                        quizData={lesson.quiz_data}
                        onCompleted={handleLessonComplete}
                      />
                    </div>
                  </div>
                )}

                {!hasVideo && !hasText && !hasQuiz && (
                  <div className="rounded-2xl bg-white border border-[#e8e0d2] p-10 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                      No content in this lesson yet
                    </p>
                  </div>
                )}
              </div>

              {/* Meta below content */}
              <div className="mt-8 pb-2">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <div className="text-[11px] uppercase font-black tracking-widest text-[#ddb049]">
                    Lesson {lessonNumber}
                  </div>

                  {hasVideo && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-50 bg-amber-800 border border-amber-100">
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

              {/* 🎉 CERTIFICATE CELEBRATION BANNER (Only Last Lesson + Course Completed) */}
              {showCertificateButton && (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 border-2 border-amber-300 p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
                  {/* Decorative dots */}
                  <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-amber-400 opacity-60" />
                  <div className="absolute top-8 right-6 w-3 h-3 rounded-full bg-amber-500 opacity-40" />
                  <div className="absolute bottom-6 left-10 w-2 h-2 rounded-full bg-amber-400 opacity-50" />
                  <div className="absolute bottom-4 right-12 w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60" />

                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>

                    <div className="text-[10px] uppercase font-black text-amber-700 tracking-widest mb-1">
                      🎉 Congratulations!
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                      You've completed the entire course!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-5">
                      Get your official certificate to celebrate your achievement
                    </p>

                    <Link
                      href={`/certificate/${course.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 border-b-[4px] border-amber-700 hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-black shadow-[0_8px_20px_rgba(245,158,11,0.4)] cursor-pointer transition-all"
                    >
                      <Award className="w-5 h-5" />
                      <span>Get Your Certificate</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* NEXT / PREV NAVIGATION */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-[#e8e0d2] pt-6">
                {prevLesson ? (
                  <Link
                    href={`/learn/${course.id}/${prevLesson.id}`}
                    className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-[#e8e0d2] hover:border-[#ddb049] cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#fbfaf7] flex items-center justify-center shrink-0 group-hover:bg-amber-50">
                      <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#ddb049]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">
                        Previous Lesson
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate group-hover:text-[#ddb049]">
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
                    <div className="w-11 h-11 rounded-full bg-[#ddb049] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-5 h-5 text-slate-900" />
                    </div>
                  </Link>
                ) : (
                  <>
                    {/* GRID: 2 buttons if course is complete, 1 button otherwise */}
                    {showCertificateButton ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link
                          href={`/learn/${course.id}`}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-[#e8e0d2] hover:border-slate-300 cursor-pointer transition-all group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">
                              Course Overview
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                              Back to Overview
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                          </div>
                        </Link>

                        <Link
                          href={`/certificate/${course.id}`}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 cursor-pointer transition-all group shadow-[0_8px_20px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] uppercase font-black text-amber-100 tracking-wider mb-0.5">
                              Certificate Ready
                            </div>
                            <div className="text-sm font-bold text-white">
                              Get Your Certificate
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/learn/${course.id}`}
                        className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#20B486] to-[#059669] cursor-pointer transition-all group shadow-[0_8px_20px_rgba(32,180,134,0.3)] hover:-translate-y-0.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase font-black text-emerald-100 tracking-wider mb-0.5">
                            Last Lesson
                          </div>
                          <div className="text-sm font-bold text-white">Back to Overview</div>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      </Link>
                    )}
                  </>
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
    cyan: 'text-[#ddb049]',
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

// ─────── MOBILE SIDEBAR COMPONENTS ───────

const MobileTabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black cursor-pointer transition-all border-b-2 ${
      active
        ? 'text-[#ddb049] border-[#ddb049]'
        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-[#fbfaf7]'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

const MobileOutlineTab = ({ course, modules, completedIds, currentLessonId, onLessonClick }: any) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const initialExpanded: Record<string, boolean> = {};
  modules.forEach((m: any) => {
    initialExpanded[m.id] = (m.lessons || []).some((l: any) => l.id === currentLessonId);
  });
  // Merge with existing expanded state
  const mergedExpanded = { ...initialExpanded, ...expanded };

  const q = search.trim().toLowerCase();
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="p-4 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lessons..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7] text-sm"
        />
      </div>

      <div className="space-y-2">
        {modules.map((mod: any, mi: number) => {
          const lessons = mod.lessons || [];
          const filtered = q
            ? lessons.filter((l: any) => l.title.toLowerCase().includes(q))
            : lessons;
          if (q && filtered.length === 0) return null;

          const doneInMod = lessons.filter((l: any) => completedIds.has(l.id)).length;
          const isOpen = q ? true : mergedExpanded[mod.id];

          return (
            <div key={mod.id} className="border border-[#e8e0d2] rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[#fbfaf7] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-slate-700">{mi + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">
                    Module {mi + 1}
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate leading-tight">
                    {mod.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {doneInMod}/{lessons.length}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="bg-[#fbfaf7] border-t border-[#f0ebe2]">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 text-center font-medium">
                      No lessons
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filtered.map((l: any, li: number) => {
                        const isCurrent = l.id === currentLessonId;
                        const isDone = completedIds.has(l.id);
                        const isMixed = l.lesson_type === 'mixed';
                        const duration = l.duration_seconds || 0;
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;

                        return (
                          <button
                            key={l.id}
                            onClick={() => onLessonClick()}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all w-full text-left ${
                              isCurrent
                                ? 'bg-amber-50 border border-amber-200'
                                : 'hover:bg-white border border-transparent'
                            }`}
                          >
                            {isDone ? (
                              <div className="w-5 h-5 rounded-full bg-[#ddb049] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-5 h-5 rounded-full border-2 border-[#ddb049] flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ddb049]" />
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-bold truncate ${
                                  isCurrent ? 'text-[#ddb049]' : 'text-slate-900'
                                }`}
                              >
                                {mi + 1}.{li + 1} {l.title}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                                {isMixed ? (
                                  <>
                                    <div className="flex items-center gap-0.5">
                                      <Video className="w-2.5 h-2.5 text-[#ddb049]" />
                                      <FileText className="w-2.5 h-2.5 text-[#20B486]" />
                                      <HelpCircle className="w-2.5 h-2.5 text-purple-500" />
                                    </div>
                                    <span className="ml-1">Multi-content</span>
                                  </>
                                ) : l.lesson_type === 'video' ? (
                                  <>
                                    <Play className="w-2.5 h-2.5" />
                                    <span>
                                      {mins}:{String(secs).padStart(2, '0')}
                                    </span>
                                  </>
                                ) : l.lesson_type === 'text' ? (
                                  <>
                                    <FileText className="w-2.5 h-2.5" />
                                    <span>Text</span>
                                  </>
                                ) : (
                                  <>
                                    <HelpCircle className="w-2.5 h-2.5" />
                                    <span>Quiz</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            No content available
          </div>
        )}
      </div>
    </div>
  );
};

const MobileResourcesTab = ({ lessonId, lessonTitle }: any) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources?lessonId=${lessonId}`);
        const data = await res.json();
        setResources(data.resources || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
          Lesson Resources
        </div>
        <div className="text-xs text-slate-600 font-medium truncate">{lessonTitle}</div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#e8e0d2] rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No resources for this lesson</p>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.download_url || r.external_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#fbfaf7] hover:bg-slate-100 border border-[#e8e0d2] cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e0d2] flex items-center justify-center shrink-0">
                <FileText
                  className={`w-4 h-4 ${
                    r.resource_type === 'link' ? 'text-[#ddb049]' : 'text-[#F86BCF]'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{r.title}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {r.resource_type === 'link' ? 'External Link' : r.resource_type?.toUpperCase()}
                </div>
              </div>
              {r.resource_type === 'link' ? (
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#ddb049] shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-slate-400 group-hover:text-[#F86BCF] shrink-0" />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileNotesTab = ({ courseId, lessonId, lessonTitle }: any) => {
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notes?lessonId=${lessonId}`);
        const data = await res.json();
        if (data.notes && data.notes.length > 0) {
          setNote(data.notes[0].content);
          setNoteId(data.notes[0].id);
        } else {
          setNote('');
          setNoteId(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  const handleChange = (value: string) => {
    setNote(value);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      autoSave(value);
    }, 1500);
    setAutoSaveTimer(timer);
  };

  const autoSave = async (content: string) => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (noteId) {
        await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId, content: content.trim() }),
        });
        const data = await res.json();
        if (data.note) setNoteId(data.note.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!note.trim()) {
      toast.error('Note is empty');
      return;
    }
    await autoSave(note);
    toast.success('Note saved!');
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
          Notes For
        </div>
        <div className="text-sm font-black text-slate-900 truncate">{lessonTitle}</div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your notes here... They will be saved automatically."
            className="flex-1 min-h-[300px] px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7] text-sm resize-none font-medium leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-[10px] text-slate-500 font-medium">
              {note.length} characters
            </div>
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};