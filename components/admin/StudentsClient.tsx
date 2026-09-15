'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  ChevronRight,
  GraduationCap,
  Download,
  Filter,
  ChevronLeft,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  courses: any[];
  role: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export const StudentsClient: React.FC<Props> = ({ courses, role }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [hasPurchases, setHasPurchases] = useState('all');
  const [sort, setSort] = useState('newest');

  const [queryObj, setQueryObj] = useState({
    page: 1,
    search: '',
    courseId: 'all',
    hasPurchases: 'all',
    sort: 'newest',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryObj({ page: 1, search, courseId, hasPurchases, sort });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, courseId, hasPurchases, sort]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', queryObj.page.toString());
        params.set('limit', '10');
        if (queryObj.search.trim()) params.set('search', queryObj.search.trim());
        if (queryObj.courseId !== 'all') params.set('courseId', queryObj.courseId);
        if (queryObj.hasPurchases !== 'all') params.set('hasPurchases', queryObj.hasPurchases);
        params.set('sort', queryObj.sort);

        const res = await fetch(`/api/admin/students?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setStudents(data.students);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasPrev: data.pagination.hasPrev ?? data.pagination.page > 1,
          hasNext: data.pagination.hasNext ?? data.pagination.page < data.pagination.totalPages,
        });
      } catch (err: any) {
        toast.error(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    })();
  }, [queryObj]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setQueryObj((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (courseId !== 'all') params.set('courseId', courseId);
      if (hasPurchases !== 'all') params.set('hasPurchases', hasPurchases);
      params.set('sort', sort);

      const res = await fetch(`/api/admin/students/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const canEnroll = ['super_admin', 'admin', 'sales'].includes(role);
  const canSeeAssignments = ['super_admin', 'admin'].includes(role);
  const isSales = role === 'sales';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            {isSales ? 'My Students' : 'Students'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {pagination.total.toLocaleString()} {isSales ? 'assigned to you' : 'total students'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={downloading || students.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e0d2] hover:bg-[#fbfaf7] text-slate-700 text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>

          {canEnroll && (
            <Link
              href={`/${PORTAL_SLUG}/students/enroll`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] hover:border-b-[1px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none text-sm"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="relative flex-1 sm:w-48">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none text-sm font-bold appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <select
            value={hasPurchases}
            onChange={(e) => setHasPurchases(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none text-sm font-bold appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Students</option>
            <option value="yes">With Purchases</option>
            <option value="no">No Purchases</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none text-sm font-bold appearance-none bg-white cursor-pointer bg-[#fbfaf7]"
          >
            <option value="newest">Newest Signups</option>
            <option value="oldest">Oldest Signups</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-black text-slate-900 mb-1">No students found</p>
            <p className="text-sm text-slate-500 font-medium">
              {isSales
                ? 'You have no assigned students yet.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-[#f0ebe2] bg-[#fbfaf7] text-[10px] uppercase font-black text-slate-500 tracking-wider">
              <div className="col-span-5">Student</div>
              <div className="col-span-2 text-center">Enrollments</div>
              <div className="col-span-2 text-center">Avg Progress</div>
              <div className="col-span-3 text-right pr-4">Joined</div>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((s) => (
                <Link
                  key={s.id}
                  href={`/${PORTAL_SLUG}/students/${s.id}`}
                  className="block p-4 hover:bg-[#fbfaf7] transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Student Info */}
                    <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                      <UserAvatar avatarKey={s.avatarUrl} name={s.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-black text-slate-900 truncate">
                            {s.fullName || 'Unnamed'}
                          </span>
                          {!s.isActive && (
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-2 flex-wrap">
                          <span>{s.phone || s.email}</span>
                          {canSeeAssignments && (
                            <>
                              {s.assignedToName ? (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                  👤 {s.assignedToName}
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 border border-[#e8e0d2] px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                  Unassigned
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enrollments */}
                    <div className="sm:col-span-2 flex sm:justify-center items-center gap-2 text-xs">
                      <span className="sm:hidden font-bold text-slate-500">Enrolled:</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                        {s.coursesCount} course{s.coursesCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="sm:col-span-2 flex sm:justify-center items-center gap-2 text-xs">
                      <span className="sm:hidden font-bold text-slate-500">Progress:</span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${s.avgProgress}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{s.avgProgress}%</span>
                      </div>
                    </div>

                    {/* Joined */}
                    <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 font-medium">
                      <span className="sm:hidden font-bold text-slate-500">Joined:</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#f0ebe2] bg-[#fbfaf7] flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium hidden sm:block">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg bg-white border border-[#e8e0d2] hover:bg-[#fbfaf7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-sm font-bold text-slate-700 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg bg-white border border-[#e8e0d2] hover:bg-[#fbfaf7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};