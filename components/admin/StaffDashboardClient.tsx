'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Users,
  Receipt,
  BookOpen,
  DollarSign,
  UserPlus,
  TrendingUp,
  Award,
  AlertCircle,
  GraduationCap,
  Clock,
  BarChart3,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  role: string;
  name: string;
}

export const StaffDashboardClient: React.FC<Props> = ({ role, name }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setData(json);
      } catch (err: any) {
        toast.error(err.message || 'Dashboard failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ddb049]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-sm font-bold text-slate-500">
        Could not load dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          Welcome, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 font-medium capitalize">
          {role.replace('_', ' ')} dashboard overview
        </p>
      </div>

      {role === 'sales' && <SalesDashboard data={data.sales} />}
      {role === 'instructor' && <InstructorDashboard data={data.instructor} />}
      {['super_admin', 'admin'].includes(role) && (
        <AdminDashboard data={data.admin} role={role} />
      )}
    </div>
  );
};

/* ───────────────── SALES ───────────────── */
const SalesDashboard = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard icon={Users} label="My Students" value={data.assignedStudents} color="indigo" />
      <StatCard icon={BookOpen} label="Active Enrollments" value={data.studentsWithEnrollments} color="cyan" />
      <StatCard icon={TrendingUp} label="Avg Progress" value={`${data.avgProgress}%`} color="emerald" />
      <StatCard icon={Receipt} label="Pending Payments" value={data.pendingPayments} color="amber" />
    </div>

    <div className="flex flex-wrap gap-2">
      <Link
        href={`/${PORTAL_SLUG}/students`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
      >
        <Users className="w-4 h-4" /> My Students
      </Link>
      <Link
        href={`/${PORTAL_SLUG}/students/enroll`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ddb049] text-[#0a0704] text-sm font-bold"
      >
        <UserPlus className="w-4 h-4" /> Enroll Student
      </Link>
      <Link
        href={`/${PORTAL_SLUG}/payments`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e0d2] text-slate-800 text-sm font-bold"
      >
        <Receipt className="w-4 h-4" /> Review Payments
      </Link>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f0ebe2] flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Recent Assigned Students</h2>
          <Link href={`/${PORTAL_SLUG}/students`} className="text-xs font-bold text-[#ddb049] hover:underline">
            View all
          </Link>
        </div>
        {data.recentStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-medium">
            No students assigned yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentStudents.map((s: any) => (
              <Link
                key={s.id}
                href={`/${PORTAL_SLUG}/students/${s.id}`}
                className="flex items-center gap-3 p-4 hover:bg-[#fbfaf7] cursor-pointer"
              >
                <UserAvatar avatarKey={s.avatar_url} name={s.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">{s.full_name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {s.phone || 'No phone'} · Joined {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f0ebe2]">
          <h2 className="text-base font-black text-slate-900">Student Progress Snapshot</h2>
        </div>
        {data.recentProgress.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-medium">
            No progress data yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentProgress.map((p: any, i: number) => (
              <div key={`${p.user_id}-${i}`} className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-bold text-slate-900 truncate pr-3">
                    {p.course_title}
                  </div>
                  <div className="text-xs font-black text-slate-700">{p.progress_percent}%</div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#20B486] rounded-full"
                    style={{ width: `${p.progress_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);

/* ───────────────── INSTRUCTOR ───────────────── */
const InstructorDashboard = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard icon={BookOpen} label="My Courses" value={data.coursesCount} color="cyan" />
      <StatCard icon={Users} label="Total Enrolled" value={data.totalEnrolled} color="indigo" />
      <StatCard icon={TrendingUp} label="Avg Completion" value={`${data.avgCompletion}%`} color="emerald" />
      <StatCard icon={Award} label="Certificates" value={data.certificatesIssued} color="amber" />
    </div>

    <div className="flex flex-wrap gap-2">
      <Link
        href={`/${PORTAL_SLUG}/courses`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
      >
        <BookOpen className="w-4 h-4" /> Manage Courses
      </Link>
      <Link
        href={`/${PORTAL_SLUG}/students`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e0d2] text-slate-800 text-sm font-bold"
      >
        <GraduationCap className="w-4 h-4" /> My Students
      </Link>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f0ebe2]">
          <h2 className="text-base font-black text-slate-900">My Courses</h2>
        </div>
        {data.myCourses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-medium">No courses yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.myCourses.slice(0, 6).map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <CourseThumbnail
                  thumbnailKey={c.thumbnail_url}
                  alt={c.title}
                  className="w-12 h-12 rounded-xl object-cover"
                  fallbackClassName="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {c.is_published ? 'Published' : 'Draft'} · ETB{' '}
                    {Number(c.price || 0).toLocaleString()}
                  </div>
                </div>
                <Link
                  href={`/${PORTAL_SLUG}/courses/${c.id}/analytics`}
                  className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-[#ddb049]"
                  title="Analytics"
                >
                  <BarChart3 className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f0ebe2]">
          <h2 className="text-base font-black text-slate-900">Recent Enrollments</h2>
        </div>
        {data.recentEnrollments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-medium">
            No enrollments yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentEnrollments.map((e: any, i: number) => (
              <Link
                key={`${e.user_id}-${i}`}
                href={`/${PORTAL_SLUG}/students/${e.user_id}`}
                className="flex items-center gap-3 p-4 hover:bg-[#fbfaf7] cursor-pointer"
              >
                <UserAvatar
                  avatarKey={e.student?.avatar_url}
                  name={e.student?.full_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {e.student?.full_name || 'Student'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {e.courseTitle} · {new Date(e.enrolled_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);

/* ───────────────── ADMIN ───────────────── */
const AdminDashboard = ({ data, role }: { data: any; role: string }) => (
  <>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard icon={Receipt} label="Pending Payments" value={data.pendingPayments} color="amber" />
      <StatCard icon={Users} label="Total Students" value={data.totalStudents} color="cyan" />
      <StatCard icon={DollarSign} label="Revenue" value={`ETB ${Number(data.totalRevenue).toLocaleString()}`} color="emerald" />
      <StatCard icon={BookOpen} label="Courses" value={data.totalCourses} color="indigo" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MiniStat label="Approved Payments" value={data.approvedPayments} />
      <MiniStat label="Sales Reps" value={data.totalSales} />
      <MiniStat label="Unassigned Students" value={data.unassignedStudents} />
      <MiniStat label="Role" value={role.replace('_', ' ')} />
    </div>

    {data.unassignedStudents > 0 && (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-black text-amber-900">
            {data.unassignedStudents} unassigned student{data.unassignedStudents !== 1 ? 's' : ''}
          </div>
          <p className="text-xs text-amber-800 font-medium mt-0.5">
            Assign them to sales reps so follow-ups stay organized.
          </p>
          <Link
            href={`/${PORTAL_SLUG}/students`}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline mt-2"
          >
            <UserCog className="w-3.5 h-3.5" /> Go to Students
          </Link>
        </div>
      </div>
    )}

    <div className="flex flex-wrap gap-2">
      <Link href={`/${PORTAL_SLUG}/payments`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
        <Receipt className="w-4 h-4" /> Payments
      </Link>
      <Link href={`/${PORTAL_SLUG}/students`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ddb049] text-[#0a0704] text-sm font-bold">
        <Users className="w-4 h-4" /> Students
      </Link>
      <Link href={`/${PORTAL_SLUG}/students/enroll`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e0d2] text-slate-800 text-sm font-bold">
        <UserPlus className="w-4 h-4" /> Enroll
      </Link>
    </div>

    <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#f0ebe2] flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" /> Recent Payments
        </h2>
        <Link href={`/${PORTAL_SLUG}/payments`} className="text-xs font-bold text-[#ddb049] hover:underline">
          View all
        </Link>
      </div>
      {data.recentPayments.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 font-medium">No payments yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentPayments.map((p: any) => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{p.studentName}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {p.item_type} · {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-slate-900">
                  ETB {Number(p.amount).toLocaleString()}
                </div>
                <span
                  className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                    p.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : p.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: 'cyan' | 'emerald' | 'amber' | 'indigo';
}) => {
  const colors = {
    cyan: 'bg-amber-50 border-amber-100 text-[#ddb049]',
    emerald: 'bg-emerald-50 border-emerald-100 text-[#20B486]',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{value}</div>
      <div className="text-[11px] sm:text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white rounded-xl border border-[#e8e0d2] p-3 text-center shadow-sm">
    <div className="text-lg font-black text-slate-900 capitalize">{value}</div>
    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">{label}</div>
  </div>
);