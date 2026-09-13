'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { CourseThumbnail } from './CourseThumbnail';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

export const CoursesClient: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/courses');
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to load courses');
          return;
        }
        setCourses(data.courses || []);
      } catch {
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Courses</h1>
          <p className="text-sm text-slate-500 font-medium">Create and manage your courses</p>
        </div>
        <Link
          href={`/${PORTAL_SLUG}/courses/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] text-[#0F172A] text-sm font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-4">No courses yet</p>
            <Link
              href={`/${PORTAL_SLUG}/courses/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/${PORTAL_SLUG}/courses/${c.id}`}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CourseThumbnail thumbnailKey={c.thumbnail_url} alt={c.title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-black text-slate-900 truncate">{c.title}</span>
                      {c.is_published ? (
                        <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" />
                          Published
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" />
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      ETB {Number(c.price || 0).toLocaleString()} ·{' '}
                      {c.category?.replaceAll('_', ' ') || 'Uncategorized'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};