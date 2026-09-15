'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { preloadThumbnails } from '@/lib/thumbnailCache';

interface Props {
  courses: any[];
}

export const CoursesSection: React.FC<Props> = ({ courses }) => {
  // PRELOAD ALL COURSE THUMBNAILS AT ONCE ON MOUNT
  useEffect(() => {
    preloadThumbnails((courses || []).map((c) => c.thumbnail_url));
  }, [courses]);

  if (!courses || courses.length === 0) {
    return (
      <section id="courses" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xs sm:text-sm font-black text-[#ddb049] uppercase tracking-widest mb-2">
              Premium Programs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3">
              Courses
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto mb-12">
              Enroll in our step-by-step courses to build real marketing skills.
            </p>
            <div className="bg-[#fbfaf7] rounded-2xl p-16 text-center border-2 border-dashed border-[#e8e0d2]">
              <p className="text-sm font-bold text-slate-500">Courses coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="courses" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-xs sm:text-sm font-black text-[#ddb049] uppercase tracking-widest mb-2">
            Premium Programs
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3">
            Courses
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Enroll in our step-by-step courses to build real marketing skills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-xl overflow-hidden transition-all cursor-pointer flex flex-col"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <CourseThumbnail
                  thumbnailKey={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                />

                {/* Duration badge */}
                {course.duration_hours ? (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white">
                    <Clock className="w-3 h-3 text-[#ddb049]" />
                    <span>{course.duration_hours} hrs</span>
                  </div>
                ) : null}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                {/* Category */}
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-[#ddb049] border border-amber-100">
                    {course.category?.replace('_', ' ') || 'Course'}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-[#ddb049] transition-colors">
                    {course.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#ddb049] shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                {/* Description */}
                {course.description && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 min-h-[32px]">
                    {course.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-auto pt-4 border-t border-[#f0ebe2] flex items-center justify-between">
                  <span className="text-lg font-black text-[#20B486]">
                    ETB {Number(course.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-[#ddb049]">
                    View Course →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Browse all link */}
        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer transition-all"
          >
            <span>View All Courses</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};