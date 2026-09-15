'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  FileText,
  HelpCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonVideoEditor } from './LessonVideoEditor';
import { LessonTextEditor } from './LessonTextEditor';
import { LessonQuizEditor } from './LessonQuizEditor';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

type TabType = 'video' | 'text' | 'quiz';

interface Props {
  course: any;
  initialLesson: any;
}

export const LessonEditorClient: React.FC<Props> = ({ course, initialLesson }) => {
  const router = useRouter();
  const [lesson, setLesson] = useState(initialLesson);
  const [tab, setTab] = useState<TabType>('video');
  const [title, setTitle] = useState(lesson.title);
  const [isPublished, setIsPublished] = useState(lesson.is_published !== false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const hasVideo = !!(lesson.video_key && String(lesson.video_key).trim());
  const hasText = !!(
    lesson.text_content &&
    String(lesson.text_content).replace(/<[^>]*>/g, '').trim().length > 0
  );
  const hasQuiz = !!(lesson.quiz_data?.questions && lesson.quiz_data.questions.length > 0);

  const refreshLesson = async () => {
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`);
      const data = await res.json();
      if (res.ok) setLesson(data.lesson);
    } catch {}
  };

  const saveMeta = async () => {
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Lesson details saved');
      refreshLesson();
    } finally {
      setSavingMeta(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Auto-save title/status if changed
      if (title.trim() && (title !== lesson.title || isPublished !== (lesson.is_published !== false))) {
        await fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            isPublished,
          }),
        });
      }
      toast.success('Lesson saved!');
      router.push(`/${PORTAL_SLUG}/courses/${course.id}`);
    } finally {
      setFinishing(false);
    }
  };

  const backToCourse = `/${PORTAL_SLUG}/courses/${course.id}`;

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#e8e0d2] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <Link
                href={backToCourse}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {course.title}</span>
              </Link>
              <div className="text-[10px] uppercase font-black text-[#ddb049] tracking-widest mb-1">
                {lesson.course_modules?.title || 'Editing Lesson'}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lesson title"
                  className="text-lg sm:text-2xl font-black text-slate-900 bg-transparent border-b-2 border-dashed border-[#e8e0d2] focus:border-[#ddb049] outline-none px-1 py-1 min-w-[300px] flex-1"
                />

                <div className="flex items-center gap-1">
                  {hasVideo && (
                    <div
                      className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"
                      title="Has video"
                    >
                      <Video className="w-3.5 h-3.5 text-[#ddb049]" />
                    </div>
                  )}
                  {hasText && (
                    <div
                      className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
                      title="Has text"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#20B486]" />
                    </div>
                  )}
                  {hasQuiz && (
                    <div
                      className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center"
                      title="Has quiz"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPublished(!isPublished)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isPublished ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Published</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Draft</span>
                  </>
                )}
              </button>

              <button
                onClick={saveMeta}
                disabled={savingMeta}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingMeta ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Info</span>
              </button>

              {/* FINISH button — main action */}
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[3px] border-[#047857] hover:border-b-[1px] hover:translate-y-[2px] text-white text-sm font-bold shadow-[0_8px_20px_rgba(32,180,134,0.3)] cursor-pointer disabled:opacity-50 transition-all"
              >
                {finishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{finishing ? 'Finishing...' : 'Finish'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-[#f0ebe2]">
          <TabBtn
            active={tab === 'video'}
            onClick={() => setTab('video')}
            icon={Video}
            label="Video"
            hasContent={hasVideo}
            color="cyan"
          />
          <TabBtn
            active={tab === 'text'}
            onClick={() => setTab('text')}
            icon={FileText}
            label="Text"
            hasContent={hasText}
            color="emerald"
          />
          <TabBtn
            active={tab === 'quiz'}
            onClick={() => setTab('quiz')}
            icon={HelpCircle}
            label="Quiz"
            hasContent={hasQuiz}
            color="purple"
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {tab === 'video' && (
          <LessonVideoEditor lesson={lesson} courseId={course.id} onSaved={refreshLesson} />
        )}

        {tab === 'text' && <LessonTextEditor lesson={lesson} onSaved={refreshLesson} />}

        {tab === 'quiz' && <LessonQuizEditor lesson={lesson} onSaved={refreshLesson} />}
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon: Icon, label, hasContent, color }: any) => {
  const colors: any = {
    cyan: {
      active: 'text-[#ddb049] border-[#ddb049]',
      dot: 'bg-[#ddb049]',
    },
    emerald: {
      active: 'text-[#20B486] border-[#20B486]',
      dot: 'bg-[#20B486]',
    },
    purple: {
      active: 'text-purple-600 border-purple-600',
      dot: 'bg-purple-500',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-black cursor-pointer transition-all border-b-2 ${
        active ? colors[color].active : 'text-slate-500 border-transparent hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {hasContent && (
        <span
          className={`w-2 h-2 rounded-full ${colors[color].dot}`}
          title="Has content"
        />
      )}
    </button>
  );
};