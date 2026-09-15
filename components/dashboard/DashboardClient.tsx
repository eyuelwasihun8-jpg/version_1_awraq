'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Download,
  PenTool,
  Award,
  ReceiptText,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { CoursesTab } from './CoursesTab';
import { ResourcesTab } from './ResourcesTab';
import { NotesTab } from './NotesTab';
import { CertificatesTab } from './CertificatesTab';
import { HistoryTab } from './HistoryTab';

type TabType = 'courses' | 'resources' | 'notes' | 'certificates' | 'history';

interface DashboardClientProps {
  profile: any;
  enrolledCourses: any[];
  enrolledProducts: any[];
  recommendedCourses: any[];
  progressMap: Record<string, { completed: number; total: number }>;
  certificates: any[];
  notes: any[];
  allPayments: any[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  profile,
  enrolledCourses,
  enrolledProducts,
  recommendedCourses,
  progressMap,
  certificates,
  notes,
  allPayments,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('courses');

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  // Aggregate stats
  const totalEnrolled = enrolledCourses.length;
  let totalLessonsAll = 0;
  let completedLessonsAll = 0;
  Object.values(progressMap).forEach((p) => {
    totalLessonsAll += p.total;
    completedLessonsAll += p.completed;
  });
  const overallProgress =
    totalLessonsAll === 0 ? 0 : Math.round((completedLessonsAll / totalLessonsAll) * 100);
  const certificatesEarned = certificates.length;

  const tabs = [
    { id: 'courses' as TabType, label: 'Courses', icon: BookOpen, count: enrolledCourses.length },
    {
      id: 'resources' as TabType,
      label: 'Resources',
      icon: Download,
      count: enrolledProducts.length,
    },
    { id: 'notes' as TabType, label: 'Notes', icon: PenTool, count: notes.length },
    {
      id: 'certificates' as TabType,
      label: 'Certificates',
      icon: Award,
      count: certificates.length,
    },
    { id: 'history' as TabType, label: 'History', icon: ReceiptText, count: allPayments.length },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf7] pb-20 sm:pb-16 pt-24 sm:pt-28">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#ddb049] to-[#c99a3a] flex items-center justify-center shrink-0 shadow-md">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#0a0704]" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                My Learning
              </h1>
            </div>
            <p className="text-slate-600 font-medium text-sm sm:text-base">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              Access your courses and downloads.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white border border-[#e8e0d2] text-slate-600 text-sm font-bold shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer self-start"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        {/* STATS */}
        {enrolledCourses.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            <StatCard
              icon={BookOpen}
              value={totalEnrolled}
              label="Enrolled Courses"
              iconBg="bg-amber-50"
              iconBorder="border-amber-100"
              iconColor="text-[#ddb049]"
              tagLabel="Total"
              tagColor="text-slate-400"
            />
            <StatCard
              icon={CheckCircle2}
              value={`${completedLessonsAll}`}
              subValue={`/${totalLessonsAll}`}
              label="Lessons Completed"
              iconBg="bg-emerald-50"
              iconBorder="border-emerald-100"
              iconColor="text-[#20B486]"
              tagLabel="Done"
              tagColor="text-[#20B486]"
            />
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d2] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="text-[10px] font-black text-[#3B82F6] uppercase tracking-wider">
                  Progress
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {overallProgress}
                </div>
                <div className="text-slate-400 text-lg font-bold">%</div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#ddb049] rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
            <StatCard
              icon={Award}
              value={certificatesEarned}
              label="Certificates"
              iconBg="bg-amber-50"
              iconBorder="border-amber-100"
              iconColor="text-[#F59E0B]"
              tagLabel="Earned"
              tagColor="text-[#F59E0B]"
            />
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto hide-scrollbar bg-white border border-[#e8e0d2] rounded-2xl p-1.5 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer no-min-touch ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-[#fbfaf7]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-[#ddb049] text-[#0a0704]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        {activeTab === 'courses' && (
          <CoursesTab
            enrolledCourses={enrolledCourses}
            recommendedCourses={recommendedCourses}
            progressMap={progressMap}
          />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab enrolledProducts={enrolledProducts} allPayments={allPayments} />
        )}
        {activeTab === 'notes' && (
          <NotesTab enrolledCourses={enrolledCourses} initialNotes={notes} />
        )}
        {activeTab === 'certificates' && (
          <CertificatesTab certificates={certificates} enrolledCourses={enrolledCourses} />
        )}
        {activeTab === 'history' && <HistoryTab payments={allPayments} />}
      </div>
    </div>
  );
};

// Reusable stat card
const StatCard = ({
  icon: Icon,
  value,
  subValue,
  label,
  iconBg,
  iconBorder,
  iconColor,
  tagLabel,
  tagColor,
}: any) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d2] shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} border ${iconBorder} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className={`text-[10px] font-black uppercase tracking-wider ${tagColor}`}>
        {tagLabel}
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">
      {value}
      {subValue && <span className="text-slate-400 text-lg font-bold">{subValue}</span>}
    </div>
    <div className="text-[11px] sm:text-xs font-bold text-slate-600">{label}</div>
  </div>
);