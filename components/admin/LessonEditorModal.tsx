'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  FileText,
  HelpCircle,
  Upload,
  Loader2,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';
import { QuizBuilder, QuizData } from './QuizBuilder';

interface Props {
  courseId: string;
  moduleId: string;
  lesson?: any;
  orderIndex: number;
  onClose: () => void;
  onSaved: () => void;
}

export const LessonEditorModal: React.FC<Props> = ({
  courseId,
  moduleId,
  lesson,
  orderIndex,
  onClose,
  onSaved,
}) => {
  const isEdit = !!lesson;

  const [title, setTitle] = useState(lesson?.title || '');
  const [duration, setDuration] = useState(lesson?.duration_seconds?.toString() || '0');
  const [isPublished, setIsPublished] = useState(lesson?.is_published !== false);

  // Which sections are enabled
  const [enableVideo, setEnableVideo] = useState(!!lesson?.video_key);
  const [enableText, setEnableText] = useState(
    !!(lesson?.text_content && String(lesson.text_content).replace(/<[^>]*>/g, '').trim())
  );
  const [enableQuiz, setEnableQuiz] = useState(
    !!(lesson?.quiz_data?.questions && lesson.quiz_data.questions.length > 0)
  );

  // Content
  const [videoKey, setVideoKey] = useState(lesson?.video_key || '');
  const [textContent, setTextContent] = useState(lesson?.text_content || '');
  const [quizData, setQuizData] = useState<QuizData>(
    (lesson?.quiz_data as QuizData) || { passing_score: 70, questions: [] }
  );

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'video/mp4',
          folder: `courses/${courseId}/lessons`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to get upload URL');
        return;
      }

      const { uploadUrl, fileKey } = data;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setVideoKey(fileKey);
      setEnableVideo(true);

      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        setDuration(Math.round(videoEl.duration).toString());
        URL.revokeObjectURL(videoEl.src);
      };
      videoEl.src = URL.createObjectURL(file);

      toast.success('Video uploaded!');
    } catch {
      toast.error('Upload failed. Check R2 CORS.');
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = () => {
    setVideoKey('');
    setEnableVideo(false);
    setDuration('0');
  };

  const removeText = () => {
    setTextContent('');
    setEnableText(false);
  };

  const removeQuiz = () => {
    setQuizData({ passing_score: 70, questions: [] });
    setEnableQuiz(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    const hasVideo = enableVideo && !!videoKey;
    const hasText =
      enableText && !!textContent.replace(/<[^>]*>/g, '').trim();
    const hasQuiz = enableQuiz && (quizData.questions?.length || 0) > 0;

    if (!hasVideo && !hasText && !hasQuiz) {
      toast.error('Add at least one section: Video, Text, or Quiz');
      return;
    }

    if (hasVideo && !videoKey) {
      toast.error('Upload a video or remove the Video section');
      return;
    }
    if (hasQuiz) {
      const invalid = quizData.questions.some(
        (q) =>
          !q.question.trim() ||
          !q.options.some((o) => o.is_correct) ||
          q.options.some((o) => !o.text.trim() && q.type !== 'true_false')
      );
      if (invalid) {
        toast.error('Some quiz questions are incomplete');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        courseId,
        moduleId,
        title: title.trim(),
        orderIndex,
        durationSeconds: parseInt(duration) || (hasVideo ? 0 : 60),
        isPublished,
        videoKey: hasVideo ? videoKey : null,
        textContent: hasText ? textContent : null,
        quizData: hasQuiz ? quizData : null,
      };

      const url = isEdit ? `/api/admin/lessons/${lesson.id}` : '/api/admin/lessons';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }

      toast.success(isEdit ? 'Lesson updated!' : 'Lesson added!');
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl my-0 sm:my-8 min-h-screen sm:min-h-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
              {isEdit ? 'Edit Lesson' : 'New Lesson'}
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Combine Video, Text & Quiz in one lesson
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Lesson Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 1.1 Introduction to SEO"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
            />
          </div>

          {/* Section toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Content sections (add any combination)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <SectionToggle
                active={enableVideo}
                onClick={() => {
                  if (enableVideo) removeVideo();
                  else setEnableVideo(true);
                }}
                icon={Video}
                label="Video"
                color="cyan"
              />
              <SectionToggle
                active={enableText}
                onClick={() => {
                  if (enableText) removeText();
                  else setEnableText(true);
                }}
                icon={FileText}
                label="Text"
                color="emerald"
              />
              <SectionToggle
                active={enableQuiz}
                onClick={() => {
                  if (enableQuiz) removeQuiz();
                  else setEnableQuiz(true);
                }}
                icon={HelpCircle}
                label="Quiz"
                color="purple"
              />
            </div>
          </div>

          {/* VIDEO SECTION */}
          {enableVideo && (
            <SectionCard
              title="Video"
              icon={Video}
              color="cyan"
              onRemove={removeVideo}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {videoKey && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready ({duration}s)</span>
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {uploading ? 'Uploading...' : videoKey ? 'Replace Video' : 'Upload Video'}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Uploading to R2</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#07CCFD] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="0"
                  className="w-32 px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-sm font-mono"
                />
              </div>
            </SectionCard>
          )}

          {/* TEXT SECTION */}
          {enableText && (
            <SectionCard title="Text Content" icon={FileText} color="emerald" onRemove={removeText}>
              <RichTextEditor content={textContent} onChange={setTextContent} />
            </SectionCard>
          )}

          {/* QUIZ SECTION */}
          {enableQuiz && (
            <SectionCard title="Quiz" icon={HelpCircle} color="purple" onRemove={removeQuiz}>
              <QuizBuilder data={quizData} onChange={setQuizData} />
            </SectionCard>
          )}

          {!enableVideo && !enableText && !enableQuiz && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-slate-600 mb-1">No content sections yet</p>
              <p className="text-xs text-slate-500 font-medium mb-4">
                Turn on Video, Text, and/or Quiz above
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnableVideo(true)}
                  className="px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setEnableText(true)}
                  className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setEnableQuiz(true)}
                  className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Quiz
                </button>
              </div>
            </div>
          )}

          {/* Publish */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Publish Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublished(false)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  !isPublished
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setIsPublished(true)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  isPublished
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                Published
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 p-5 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] text-[#0F172A] text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : isEdit ? 'Update Lesson' : 'Save Lesson'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionToggle = ({ active, onClick, icon: Icon, label, color }: any) => {
  const map: any = {
    cyan: active
      ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
      : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300',
    emerald: active
      ? 'border-[#20B486] bg-emerald-50 text-[#20B486]'
      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300',
    purple: active
      ? 'border-purple-500 bg-purple-50 text-purple-600'
      : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-1.5 ${map[color]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold">{label}</span>
      <span className="text-[9px] font-black uppercase tracking-wider opacity-70">
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};

const SectionCard = ({ title, icon: Icon, color, onRemove, children }: any) => {
  const colors: any = {
    cyan: 'border-cyan-200 bg-cyan-50/30',
    emerald: 'border-emerald-200 bg-emerald-50/30',
    purple: 'border-purple-200 bg-purple-50/30',
  };
  const iconColors: any = {
    cyan: 'text-[#07CCFD]',
    emerald: 'text-[#20B486]',
    purple: 'text-purple-600',
  };
  return (
    <div className={`rounded-2xl border-2 p-4 sm:p-5 space-y-3 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColors[color]}`} />
          <span className="text-sm font-black text-slate-900">{title}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
          title="Remove section"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
};