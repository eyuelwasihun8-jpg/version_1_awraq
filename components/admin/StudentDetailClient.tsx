'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Receipt,
  UserX,
  UserCheck,
  MoreVertical,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  studentId: string;
  role: string;
}

export const StudentDetailClient: React.FC<Props> = ({ studentId, role }) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
      if (err.message === 'Forbidden' || err.message === 'Student not found') {
        router.push(`/${PORTAL_SLUG}/students`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [studentId]);

  const canManage = ['super_admin', 'admin', 'sales'].includes(role);

  const toggleActive = async (currentStatus: boolean) => {
    if (!canManage) return;
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this student?`)) return;
    
    setUpdating(true);
    setShowMenu(false);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Student ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchDetail();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const revokeAccess = async (itemType: string, itemId: string, title: string) => {
    if (!canManage) return;
    const reason = prompt(`Revoke access to "${title}"?\n\nEnter reason for audit log:`);
    if (reason === null) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/students/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, itemType, itemId, reason }),
      });
      if (!res.ok) throw new Error('Failed to revoke');
      toast.success('Access revoked');
      fetchDetail();
    } catch {
      toast.error('Revoke failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#07CCFD]" />
      </div>
    );
  }

  if (!data) return null;

  const { student, courses, products, payments, certificates, quizAttempts } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/${PORTAL_SLUG}/students`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>

        {canManage && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={updating}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-20">
                  <button
                    onClick={() => toggleActive(student.is_active)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    {student.is_active ? (
                      <><UserX className="w-4 h-4 text-red-500" /> Suspend Account</>
                    ) : (
                      <><UserCheck className="w-4 h-4 text-emerald-500" /> Reactivate Account</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <UserAvatar avatarKey={student.avatar_url} name={student.full_name} size="2xl" />
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {student.full_name || 'Unnamed Student'}
              </h1>
              {!student.is_active && (
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-[10px] uppercase font-black tracking-wider">
                  Suspended
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-600 font-medium mb-6">
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {student.email || 'No email'}</div>
              <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {student.phone || 'No phone'}</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Joined {new Date(student.created_at).toLocaleDateString()}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoBox label="Gender" value={student.gender} />
              <InfoBox label="Age" value={student.age_group} />
              <InfoBox label="Status" value={student.life_status?.replace('_', ' ')} />
              <InfoBox label="Enrollments" value={courses.length} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Courses & Products */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Courses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#07CCFD]" /> Enrolled Courses
              </h2>
              {canEnrollBtn(role) && (
                <Link href={`/${PORTAL_SLUG}/students/enroll`} className="text-xs font-bold text-[#07CCFD] hover:underline">
                  + Enroll
                </Link>
              )}
            </div>
            
            {courses.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No active courses</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {courses.map((c: any) => (
                  <div key={c.course_id} className={`p-5 ${!c.enrollment_active ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-start gap-4">
                      <CourseThumbnail thumbnailKey={c.course_thumbnail} alt={c.course_title} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-black text-slate-900 truncate pr-4">{c.course_title}</h3>
                          {canManage && c.enrollment_active && (
                            <button
                              onClick={() => revokeAccess('course', c.course_id, c.course_title)}
                              className="text-[10px] text-red-500 font-bold hover:underline shrink-0 cursor-pointer"
                            >
                              Revoke Access
                            </button>
                          )}
                          {!c.enrollment_active && (
                            <span className="text-[10px] uppercase font-black text-red-600 tracking-wider">Revoked</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Source: {c.enrollment_source}</span>
                          <span>·</span>
                          <span>Enrolled: {new Date(c.enrolled_at).toLocaleDateString()}</span>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#20B486]" style={{ width: `${c.progress_percent}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-700 w-10 text-right">
                            {c.progress_percent}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                          {c.completed_lessons} of {c.total_lessons} lessons completed
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Attempts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-500" /> Recent Quiz Attempts
              </h2>
            </div>
            
            {quizAttempts.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No quiz attempts yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {quizAttempts.map((q: any) => (
                  <div key={q.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">{q.lessons?.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {new Date(q.attempted_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm font-black ${q.passed ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {q.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Payments & Certificates */}
        <div className="space-y-6">
          
          {/* Certificates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" /> Certificates ({certificates.length})
            </h2>
            {certificates.length === 0 ? (
              <div className="text-xs text-slate-500 font-medium italic">No certificates earned yet</div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{cert.courses?.title}</div>
                    <div className="text-[10px] font-mono text-amber-700 mt-1">{cert.certificate_code}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Issued: {new Date(cert.issued_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments (Admin/Sales only) */}
          {canManage && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-700" /> Payment History
                </h2>
              </div>
              
              {payments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-medium">No payments</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {payments.map((p: any) => (
                    <div key={p.id} className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black text-slate-900">ETB {Number(p.amount).toLocaleString()}</span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                          p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                        {p.item_type} · {p.payment_method}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }: any) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
    <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">{label}</div>
    <div className="text-sm font-bold text-slate-900 truncate capitalize">{value || '—'}</div>
  </div>
);

function canEnrollBtn(role: string) {
  return ['super_admin', 'admin', 'sales'].includes(role);
}