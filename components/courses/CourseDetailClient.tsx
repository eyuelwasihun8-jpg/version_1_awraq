'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Star,
  ArrowLeft,
  User,
  Lock,
  Users,
  MessageSquareQuote,
} from 'lucide-react';
import { useModals } from '@/components/RootLayoutClient';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

interface Props {
  course: any;
  lessonCount: number;
  studentCount: number;
  reviews: any[];
  averageRating: number;
  isLoggedIn: boolean;
  isEnrolled: boolean;
}

export const CourseDetailClient: React.FC<Props> = ({
  course,
  lessonCount,
  studentCount,
  reviews,
  averageRating,
  isLoggedIn,
  isEnrolled,
}) => {
  const router = useRouter();
  const { openSignIn } = useModals();

  const handlePurchase = () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }
    router.push(`/purchase/item/course/${course.id}`);
  };

  const handleStartLearning = () => {
    router.push(`/learn/${course.id}`);
  };

  const formatStudents = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
    return n.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="aspect-video bg-slate-100 relative">
                <CourseThumbnail
                  thumbnailKey={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                />
              </div>

              <div className="p-5 sm:p-6 lg:p-8">
                <div className="text-[10px] uppercase font-black tracking-widest text-[#07CCFD] mb-2">
                  {course.category?.replace('_', ' ') || 'Course'}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">
                  {course.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {averageRating > 0 && (
                    <>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{averageRating}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                      </span>
                      <span className="text-slate-300">·</span>
                    </>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Users className="w-3.5 h-3.5 text-[#07CCFD]" />
                    <span>
                      {formatStudents(studentCount)} student{studentCount !== 1 ? 's' : ''} enrolled
                    </span>
                  </div>
                </div>

                {course.instructor && (
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                    <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {course.instructor.avatar_url ? (
                        <img src={course.instructor.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Instructor</div>
                      <div className="text-sm font-bold text-slate-900">
                        {course.instructor.full_name || 'Awraq Instructor'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <StatBox icon={BookOpen} label="Lessons" value={String(lessonCount)} />
                  <StatBox icon={Users} label="Students" value={formatStudents(studentCount)} />
                  <StatBox icon={Clock} label="Access" value="Lifetime" />
                  <StatBox icon={Award} label="Certificate" value="Yes" />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mb-2">About This Course</h2>
                  <p className="text-sm text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                    {course.description || 'No description available for this course yet.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">What You'll Get</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Full lifetime access',
                  'Certificate of completion',
                  'Downloadable resources',
                  'Learn at your own pace',
                  'Mobile & desktop access',
                  'Direct instructor support',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareQuote className="w-5 h-5 text-[#07CCFD]" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">Student Testimonials</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Real feedback from people who completed this course
              </p>

              {reviews.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600 mb-1">No testimonials yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {r.user?.avatar_url ? (
                            <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-black text-slate-900">
                              {r.user?.full_name || 'Student'}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {r.review_text ? (
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                          “{r.review_text}”
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="mb-4">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Price</div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900">
                  ETB {Number(course.price || 0).toLocaleString()}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <Users className="w-3.5 h-3.5 text-[#07CCFD] shrink-0" />
                <span>
                  {studentCount === 0
                    ? 'Be the first to enroll'
                    : `Join ${formatStudents(studentCount)} student${studentCount !== 1 ? 's' : ''}`}
                </span>
              </div>

              {isEnrolled ? (
                <button
                  onClick={handleStartLearning}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] text-white text-sm font-bold cursor-pointer"
                >
                  Continue Learning
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] text-[#0F172A] text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
                >
                  {!isLoggedIn && <Lock className="w-4 h-4" />}
                  <span>{isLoggedIn ? 'Purchase This Course' : 'Sign In to Purchase'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value }: any) => (
  <div className="bg-slate-50 rounded-xl p-3 text-center">
    <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
    <div className="text-sm font-black text-slate-900">{value}</div>
    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{label}</div>
  </div>
);