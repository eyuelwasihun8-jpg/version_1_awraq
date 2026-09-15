'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Save,
  X,
  Settings,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResourcesManager } from './ResourcesManager';

interface Props {
  module: any;
  index: number;
  totalModules: number;
  onEditLesson: (lesson: any) => void;
  onAddLesson: () => void;
  onModuleUpdated: () => void;
  onMoveModuleUp: () => void;
  onMoveModuleDown: () => void;
  creatingLesson?: boolean;
}

export const ModuleCard: React.FC<Props> = ({
  module,
  index,
  totalModules,
  onEditLesson,
  onAddLesson,
  onModuleUpdated,
  onMoveModuleUp,
  onMoveModuleDown,
  creatingLesson = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || '');
  const [saving, setSaving] = useState(false);
  const [expandedResourceLesson, setExpandedResourceLesson] = useState<string | null>(null);

  const lessons = module.lessons || [];
  const totalDuration = lessons.reduce(
    (sum: number, l: any) => sum + (l.duration_seconds || 0),
    0
  );
  const durationMin = Math.round(totalDuration / 60);

  const saveModule = async () => {
    if (!title.trim()) {
      toast.error('Module title required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description }),
      });
      if (!res.ok) {
        toast.error('Failed to save');
        return;
      }
      toast.success('Module updated');
      setEditing(false);
      onModuleUpdated();
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async () => {
    if (
      !confirm(
        `Delete "${module.title}"?\n\nAll ${lessons.length} lesson${
          lessons.length !== 1 ? 's' : ''
        } inside will also be deleted permanently.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Module deleted');
      onModuleUpdated();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Delete lesson "${lessonTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Lesson deleted');
      onModuleUpdated();
    } catch {
      toast.error('Failed');
    }
  };

  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIdx = lessons.findIndex((l: any) => l.id === lessonId);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const newLessons = [...lessons];
    [newLessons[currentIdx], newLessons[targetIdx]] = [
      newLessons[targetIdx],
      newLessons[currentIdx],
    ];

    const lessonOrders = newLessons.map((l, i) => ({ id: l.id, order_index: i }));

    try {
      const res = await fetch('/api/admin/lessons/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonOrders }),
      });
      if (!res.ok) {
        toast.error('Failed to reorder');
        return;
      }
      onModuleUpdated();
    } catch {}
  };

  const getLessonSections = (l: any) => {
    const hasVideo = !!(l.video_key && String(l.video_key).trim());
    const hasText = !!(
      l.text_content &&
      String(l.text_content).replace(/<[^>]*>/g, '').trim().length > 0
    );
    const hasQuiz = !!(l.quiz_data?.questions && l.quiz_data.questions.length > 0);
    return { hasVideo, hasText, hasQuiz };
  };

  return (
    <div className="bg-white border border-[#e8e0d2] rounded-2xl shadow-sm overflow-hidden">
      {/* Module header */}
      <div className="p-4 sm:p-5 bg-[#fbfaf7] border-b border-[#f0ebe2]">
        <div className="flex items-start gap-3">
          {/* Reorder */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={onMoveModuleUp}
              disabled={index === 0}
              className="p-0.5 rounded text-slate-400 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Move up"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={onMoveModuleDown}
              disabled={index === totalModules - 1}
              className="p-0.5 rounded text-slate-400 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Move down"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e0d2] flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-slate-700">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-white text-sm font-bold"
                  placeholder="Module title"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-white text-xs resize-none"
                />
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
                  Module {index + 1}
                </div>
                <h3 className="text-base font-black text-slate-900 truncate">
                  {module.title}
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} · {durationMin} min
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={saveModule}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setTitle(module.title);
                    setDescription(module.description || '');
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
                  title="Edit module"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={deleteModule}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                  title="Delete module"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {!editing && module.description && (
          <p className="text-xs text-slate-500 font-medium mt-2 pl-16">
            {module.description}
          </p>
        )}
      </div>

      {/* Lessons */}
      {expanded && (
        <div>
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 font-medium">
              No lessons in this module yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map((l: any, i: number) => {
                const { hasVideo, hasText, hasQuiz } = getLessonSections(l);
                const contentCount = [hasVideo, hasText, hasQuiz].filter(Boolean).length;
                const isMulti = contentCount > 1;
                const isEmpty = contentCount === 0;

                return (
                  <div key={l.id}>
                    <div className="flex items-center gap-3 p-3 sm:p-4 hover:bg-[#fbfaf7] transition-colors">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => moveLesson(l.id, 'up')}
                          disabled={i === 0}
                          className="p-0.5 rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveLesson(l.id, 'down')}
                          disabled={i === lessons.length - 1}
                          className="p-0.5 rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-xs font-black text-slate-400 w-12 text-center shrink-0">
                        {index + 1}.{i + 1}
                      </div>

                      {/* Content type icons */}
                      <div className="flex items-center gap-1 shrink-0">
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
                            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                          </div>
                        )}
                        {isEmpty && (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-[#e8e0d2] flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {l.title}
                          </span>
                          {l.is_published === false && (
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-[#e8e0d2] flex items-center gap-0.5">
                              <EyeOff className="w-2 h-2" />
                              Draft
                            </span>
                          )}
                          {isMulti && (
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-50 to-purple-50 text-slate-700 border border-[#e8e0d2]">
                              Multi
                            </span>
                          )}
                          {isEmpty && (
                            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                              Empty
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {isEmpty ? (
                            'No content — click edit to add'
                          ) : isMulti ? (
                            <>
                              {[
                                hasVideo && 'Video',
                                hasText && 'Text',
                                hasQuiz &&
                                  `Quiz (${l.quiz_data?.questions?.length || 0}Q)`,
                              ]
                                .filter(Boolean)
                                .join(' + ')}
                              {hasVideo && ` · ${l.duration_seconds || 0}s`}
                            </>
                          ) : hasQuiz ? (
                            `${l.quiz_data?.questions?.length || 0} question${
                              (l.quiz_data?.questions?.length || 0) !== 1 ? 's' : ''
                            }`
                          ) : hasVideo ? (
                            `Video · ${l.duration_seconds || 0}s`
                          ) : (
                            `Text · ~${l.duration_seconds || 60}s read`
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExpandedResourceLesson(
                              expandedResourceLesson === l.id ? null : l.id
                            )
                          }
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            expandedResourceLesson === l.id
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                          title="Manage resources"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditLesson(l)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                          title="Edit lesson"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLesson(l.id, l.title)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Resources panel */}
                    {expandedResourceLesson === l.id && (
                      <div className="p-4 bg-[#fbfaf7] border-t border-[#f0ebe2]">
                        <ResourcesManager lessonId={l.id} lessonTitle={l.title} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add lesson button */}
          <div className="p-3 border-t border-[#f0ebe2]">
            <button
              onClick={onAddLesson}
              disabled={creatingLesson}
              className="w-full py-2.5 rounded-xl bg-[#fbfaf7] hover:bg-slate-100 border-2 border-dashed border-[#e8e0d2] text-slate-600 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingLesson ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>
                {creatingLesson
                  ? 'Creating lesson...'
                  : 'Add Lesson to this Module'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};