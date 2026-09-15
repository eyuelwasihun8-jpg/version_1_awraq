'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Users,
  TrendingUp,
  Award,
  DollarSign,
  BookOpen,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  GraduationCap,
  Target,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  courseId: string;
  role: string;
}

export const CourseAnalyticsClient: React.FC<Props> = ({ courseId, role }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/courses/${courseId}/analytics`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
        setData(json);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#07CCFD]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-bold text-slate-500">Could not load analytics</p>
        <Link
          href={`/${PORTAL_SLUG}/courses/${courseId}`}
          className="text-xs font-bold text-[#07CCFD] hover:underline mt-2 inline-block"
        >
          ← Back to course
        </Link>
      </div>
    );
  }

  const { course, summary, distribution, sourceBreakdown, lessonStats, modulesWithStats, quizStats, recentEnrollments, mostAbandoned, mostCompleted, reviews } =
    data;

  const maxDist = Math.max(...Object.values(distribution as Record<string, number>), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href={`/${PORTAL_SLUG}/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Course Editor
          </Link>
          <div className="flex items-center gap-3">
            <CourseThumbnail
              thumbnailKey={course.thumbnail_url}
              alt={course.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              fallbackClassName="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"
            />
            <div>
              <div className="text-[10px] uppercase font-black text-[#07CCFD] tracking-widest">
                Course Analytics
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {course.title}
              </h1>
            </div>
          </div>
        </div>

        <Link
          href={`/${PORTAL_SLUG}/students?courseId=${courseId}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          View Students
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={summary.totalEnrolled}
          color="cyan"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Completion"
          value={`${summary.avgCompletion}%`}
          color="emerald"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={`ETB ${Number(summary.totalRevenue).toLocaleString()}`}
          color="amber"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={summary.certificatesIssued}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat label="Completed" value={summary.completedStudents} />
        <MiniStat label="In Progress" value={summary.inProgress} />
        <MiniStat label="Not Started" value={summary.notStarted} />
        <MiniStat
          label="Rating"
          value={summary.reviewCount > 0 ? `${summary.avgRating}/5` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#07CCFD]" />
              Progress Distribution
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-5">
              How students are distributed across completion levels
            </p>

            <div className="space-y-3">
              {Object.entries(distribution).map(([label, count]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-14 text-xs font-bold text-slate-600 shrink-0">
                    {label}
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#07CCFD] to-[#20B486] rounded-full transition-all"
                      style={{
                        width: `${(Number(count) / maxDist) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-8 text-xs font-black text-slate-900 text-right">
                    {Number(count)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson drop-off table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Lesson Completion Rates
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Find where students drop off
              </p>
            </div>

            {lessonStats.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">
                No lessons yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lessonStats.map((l: any, i: number) => (
                  <div key={l.id} className="p-4 flex items-center gap-3">
                    <div className="text-xs font-black text-slate-400 w-6 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {l.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium capitalize">
                        {l.lessonType} · {l.completedCount}/{summary.totalEnrolled} completed
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            l.completionRate >= 70
                              ? 'bg-emerald-500'
                              : l.completionRate >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${l.completionRate}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-black w-12 text-right ${
                          l.completionRate >= 70
                            ? 'text-emerald-600'
                            : l.completionRate >= 40
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {l.completionRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modules breakdown */}
          {modulesWithStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#20B486]" />
                Module Performance
              </h2>
              <div className="space-y-3">
                {modulesWithStats.map((m: any, i: number) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                          Module {i + 1}
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {m.title}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">
                          {m.avgCompletion}%
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {m.lessonCount} lessons
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-[#20B486] rounded-full"
                        style={{ width: `${m.avgCompletion}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz stats */}
          {quizStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500" />
                  Quiz Performance
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {quizStats.map((q: any) => (
                  <div key={q.lessonId} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {q.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {q.attemptCount} attempts · {q.passRate}% pass rate
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-purple-600">
                        {q.avgScore}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">avg score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Insights */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#07CCFD]" />
              Key Insights
            </h2>

            {mostAbandoned && summary.totalEnrolled > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-red-700 tracking-wider mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  Most Drop-off
                </div>
                <div className="text-sm font-bold text-slate-900 line-clamp-2">
                  {mostAbandoned.title}
                </div>
                <div className="text-xs text-red-700 font-medium mt-0.5">
                  Only {mostAbandoned.completionRate}% complete this lesson
                </div>
              </div>
            )}

            {mostCompleted && summary.totalEnrolled > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-emerald-700 tracking-wider mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Best Performing
                </div>
                <div className="text-sm font-bold text-slate-900 line-clamp-2">
                  {mostCompleted.title}
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-0.5">
                  {mostCompleted.completionRate}% completion rate
                </div>
              </div>
            )}

            {summary.totalEnrolled === 0 && (
              <div className="text-xs text-slate-500 font-medium italic">
                No enrollments yet — insights will appear once students join.
              </div>
            )}
          </div>

          {/* Enrollment sources */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-black text-slate-900 mb-4">Enrollment Sources</h2>
            <div className="space-y-2">
              <SourceRow label="Online Purchase" count={sourceBreakdown.purchase} total={summary.totalEnrolled} />
              <SourceRow label="Manual / Cash" count={sourceBreakdown.manual} total={summary.totalEnrolled} />
              <SourceRow label="Gift" count={sourceBreakdown.gift} total={summary.totalEnrolled} />
              <SourceRow label="Promotion" count={sourceBreakdown.promotion} total={summary.totalEnrolled} />
            </div>
          </div>

          {/* Payments summary */}
          {['super_admin', 'admin', 'sales'].includes(role) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Payments
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-lg font-black text-emerald-700">
                    {summary.approvedPayments}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">
                    Approved
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-lg font-black text-amber-700">
                    {summary.pendingPayments}
                  </div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase">
                    Pending
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="text-lg font-black text-red-700">
                    {summary.rejectedPayments}
                  </div>
                  <div className="text-[10px] font-bold text-red-600 uppercase">
                    Rejected
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Total Revenue
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ETB {Number(summary.totalRevenue).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Recent enrollments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Enrollments
              </h2>
            </div>
            {recentEnrollments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No enrollments yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {recentEnrollments.map((e: any) => (
                  <Link
                    key={`${e.user_id}-${e.enrolled_at}`}
                    href={`/${PORTAL_SLUG}/students/${e.user_id}`}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer"
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
                      <div className="text-[10px] text-slate-500 font-medium">
                        {new Date(e.enrolled_at).toLocaleDateString()} ·{' '}
                        {e.enrollment_source || 'purchase'}
                      </div>
                    </div>
                    <div className="text-xs font-black text-slate-700 shrink-0">
                      {e.progress}%
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews preview */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Latest Reviews
              </h2>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= r.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    {r.review_text && (
                      <p className="text-xs text-slate-700 font-medium line-clamp-2">
                        “{r.review_text}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: 'cyan' | 'emerald' | 'amber' | 'purple';
}) => {
  const colors = {
    cyan: 'bg-cyan-50 border-cyan-100 text-[#07CCFD]',
    emerald: 'bg-emerald-50 border-emerald-100 text-[#20B486]',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">
        {value}
      </div>
      <div className="text-[11px] sm:text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
    <div className="text-lg font-black text-slate-900">{value}</div>
    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
      {label}
    </div>
  </div>
);

const SourceRow = ({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-slate-700">{label}</span>
          <span className="font-black text-slate-900">
            {count} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-700 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};