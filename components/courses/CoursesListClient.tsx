'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Filter } from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { preloadThumbnails } from '@/lib/thumbnailCache';

const CATEGORIES = [
  { value: 'all', label: 'All Courses' },
  { value: 'digital_marketing', label: 'Digital Marketing' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'language', label: 'Language' },
  { value: 'other', label: 'Other' },
];

interface Props {
  initialCourses: any[];
}

export const CoursesListClient: React.FC<Props> = ({ initialCourses }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // PRELOAD ALL THUMBNAILS AT ONCE (single batched call)
  useEffect(() => {
    preloadThumbnails(initialCourses.map((c) => c.thumbnail_url));
  }, [initialCourses]);

  const filtered = useMemo(() => {
    return initialCourses.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || c.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [initialCourses, search, category]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-black text-[#07CCFD] uppercase tracking-widest mb-2">
            Premium Programs
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">
            All Courses
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Enroll in step-by-step courses designed to build real skills.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none bg-white text-sm shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-auto pl-11 pr-8 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-bold cursor-pointer outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-500 font-medium mb-4">
          {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">No courses found</h3>
            <p className="text-sm text-slate-500 font-medium">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((course, i) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg overflow-hidden transition-all cursor-pointer"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <CourseThumbnail
                    thumbnailKey={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                    priority={i < 6}
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-slate-700 border border-slate-200">
                    {course.category?.replace('_', ' ') || 'Course'}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2 group-hover:text-[#07CCFD] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2 min-h-[32px]">
                    {course.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">
                      {course.instructor?.full_name || 'Instructor'}
                    </span>
                    <div className="text-sm font-black text-slate-900">
                      ETB {Number(course.price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};