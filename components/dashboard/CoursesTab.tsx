'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Play, Sparkles, ArrowRight, Award } from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { preloadThumbnails } from '@/lib/thumbnailCache';

interface Props {
  enrolledCourses: any[];
  recommendedCourses: any[];
  progressMap: Record<string, { completed: number; total: number }>;
}

export const CoursesTab: React.FC<Props> = ({
  enrolledCourses,
  recommendedCourses,
  progressMap,
}) => {
  // PRELOAD ALL COURSE THUMBNAILS IN ONE BATCH ON MOUNT
  useEffect(() => {
    const allKeys = [
      ...enrolledCourses.map((c) => c.thumbnail_url),
      ...recommendedCourses.map((c) => c.thumbnail_url),
    ];
    preloadThumbnails(allKeys);
  }, [enrolledCourses, recommendedCourses]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ENROLLED COURSES */}
      {enrolledCourses.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Your Courses</h2>
            <span className="text-xs text-slate-500 font-medium">
              {enrolledCourses.length} enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((course) => {
              const p = progressMap[course.id] || { completed: 0, total: 0 };
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              const isComplete = p.total > 0 && p.completed === p.total;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-md overflow-hidden transition-all group flex flex-col"
                >
                  <Link href={`/learn/${course.id}`} className="block">
                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                      <CourseThumbnail
                        thumbnailKey={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                      />
                      {isComplete && (
                        <div className="absolute top-3 right-3 bg-amber-400 text-slate-900 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Award className="w-3 h-3" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <div className="text-[10px] uppercase font-black text-[#ddb049] tracking-widest mb-1">
                      {course.category?.replace('_', ' ') || 'Course'}
                    </div>
                    <Link href={`/learn/${course.id}`}>
                      <h3 className="text-base font-black text-slate-900 mb-3 line-clamp-2 hover:text-[#ddb049] transition-colors cursor-pointer">
                        {course.title}
                      </h3>
                    </Link>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600">
                          {p.completed} of {p.total} lessons
                        </span>
                        <span className="text-[11px] font-black text-slate-900">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isComplete
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-gradient-to-r from-[#ddb049] to-[#20B486]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/learn/${course.id}`}
                        className="flex-1 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{pct === 0 ? 'Start' : 'Continue'}</span>
                      </Link>
                      {isComplete && (
                        <Link
                          href={`/certificate/${course.id}`}
                          className="py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}

      {/* RECOMMENDED */}
      {recommendedCourses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Recommended for You</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCourses.slice(0, 6).map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-md overflow-hidden transition-all group cursor-pointer"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <CourseThumbnail
                    thumbnailKey={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-black text-slate-900 mb-1 line-clamp-2 group-hover:text-[#ddb049] transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {course.instructor?.full_name || 'Instructor'}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      ETB {Number(course.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-8 sm:p-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
      <BookOpen className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-2">No courses yet</h3>
    <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
      Explore our courses and start learning digital marketing today
    </p>
    <Link
      href="/courses"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold cursor-pointer transition-all"
    >
      <span>Browse Courses</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);