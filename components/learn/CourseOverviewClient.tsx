'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

interface Props {
  course: any;
  modules: any[];
  allLessons: any[];
  progress: any[];
}

export const CourseOverviewClient: React.FC<Props> = ({
  course,
  modules,
  allLessons,
  progress,
}) => {
  const completedIds = new Set(
    progress.filter((p) => p.is_completed).map((p) => p.lesson_id)
  );
  const completedCount = completedIds.size;
  const totalCount = allLessons.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Find first incomplete lesson
  const nextLesson =
    allLessons.find((l) => !completedIds.has(l.id)) || allLessons[0];

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden mb-6">
          <div className="aspect-[3/1] bg-slate-100 relative">
            <CourseThumbnail
              thumbnailKey={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full bg-gradient-to-br from-cyan-50 to-slate-100"
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-[10px] uppercase font-black text-[#ddb049] tracking-widest mb-1">
              {course.category?.replace('_', ' ') || 'Course'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 sm:gap-6 flex-wrap mb-4 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {totalCount} lesson{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Your Progress
                </span>
                <span className="text-xs font-black text-slate-900">
                  {completedCount} / {totalCount} lessons ({percentage}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ddb049] to-[#20B486] rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Action button */}
            {isComplete ? (
              <Link
                href={`/certificate/${course.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 border-b-[3px] border-amber-600 text-slate-900 text-sm font-bold shadow-sm cursor-pointer transition-all hover:translate-y-[1px] hover:border-b-[1px]"
              >
                <Award className="w-4 h-4" />
                <span>Get Your Certificate</span>
              </Link>
            ) : nextLesson ? (
              <Link
                href={`/learn/${course.id}/${nextLesson.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold shadow-sm cursor-pointer transition-all hover:translate-y-[1px] hover:border-b-[1px]"
              >
                <Play className="w-4 h-4" />
                <span>
                  {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                </span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No content available yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Course Content
            </h2>
            {modules.map((mod, i) => (
              <ModuleAccordion
                key={mod.id}
                module={mod}
                index={i}
                courseId={course.id}
                completedIds={completedIds}
                defaultOpen={
                  i === 0 ||
                  mod.lessons.some((l: any) => !completedIds.has(l.id))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ModuleAccordion = ({
  module,
  index,
  courseId,
  completedIds,
  defaultOpen,
}: any) => {
  const [open, setOpen] = useState(defaultOpen);
  const lessons = module.lessons || [];
  const completedInModule = lessons.filter((l: any) =>
    completedIds.has(l.id)
  ).length;
  const totalDuration = lessons.reduce(
    (s: number, l: any) => s + (l.duration_seconds || 0),
    0
  );
  const durationMin = Math.round(totalDuration / 60);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[#fbfaf7] transition-colors cursor-pointer text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-slate-700">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-0.5">
            Module {index + 1}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
            {module.title}
          </h3>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {completedInModule} of {lessons.length} lessons complete · {durationMin}{' '}
            min
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {lessons.length > 0 && completedInModule === lessons.length && (
            <CheckCircle2 className="w-5 h-5 text-[#20B486]" />
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#f0ebe2]">
          {lessons.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No lessons in this module yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map((l: any, i: number) => {
                const done = completedIds.has(l.id);
                const isMulti = l.lesson_type === 'mixed';
                const duration = l.duration_seconds || 0;
                const mins = Math.floor(duration / 60);
                const secs = duration % 60;

                return (
                  <Link
                    key={l.id}
                    href={`/learn/${courseId}/${l.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-[#fbfaf7] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-black text-slate-400 w-8 text-center shrink-0">
                      {index + 1}.{i + 1}
                    </div>

                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#20B486] shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {l.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          {isMulti ? (
                            <>
                              <Play className="w-3 h-3 text-[#ddb049]" />
                              <FileText className="w-3 h-3 text-[#20B486]" />
                              <span className="capitalize">Mixed Content</span>
                            </>
                          ) : l.lesson_type === 'video' ? (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Video</span>
                            </>
                          ) : l.lesson_type === 'text' ? (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>Text</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3 h-3" />
                              <span>Quiz</span>
                            </>
                          )}
                        </div>
                        {duration > 0 && l.lesson_type !== 'quiz' && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>
                              {mins}:{String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};