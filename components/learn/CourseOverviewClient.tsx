'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  List,
  X,
  Search,
  Download,
  Loader2,
  Save,
  StickyNote,
  ExternalLink,
} from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { toast } from 'sonner';

interface Props {
  course: any;
  modules: any[];
  allLessons: any[];
  progress: any[];
}

export const CourseOverviewClient: React.FC<Props> = ({
  course,
  modules,
  allLessons,
  progress,
}) => {
  const completedIds = new Set(
    progress.filter((p) => p.is_completed).map((p) => p.lesson_id)
  );
  const completedCount = completedIds.size;
  const totalCount = allLessons.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Find first incomplete lesson
  const nextLesson =
    allLessons.find((l) => !completedIds.has(l.id)) || allLessons[0];

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'outline' | 'resources' | 'notes'>('outline');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 w-11 h-11 rounded-xl bg-white border border-[#e8e0d2] shadow-md flex items-center justify-center cursor-pointer"
        title="Open course outline"
        aria-label="Open course outline"
      >
        <List className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] max-w-[90vw] bg-white z-50 lg:hidden flex flex-col shadow-2xl animate-slideIn">
            {/* Mobile Sidebar Header */}
            <div className="p-4 border-b border-[#e8e0d2] flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-0.5">
                  Course
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-tight truncate">{course.title}</h2>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Tabs */}
            <div className="flex border-b border-[#f0ebe2] bg-white">
              <MobileTabButton
                active={mobileTab === 'outline'}
                onClick={() => setMobileTab('outline')}
                icon={List}
                label="Outline"
              />
              <MobileTabButton
                active={mobileTab === 'resources'}
                onClick={() => setMobileTab('resources')}
                icon={FileText}
                label="Resources"
              />
              <MobileTabButton
                active={mobileTab === 'notes'}
                onClick={() => setMobileTab('notes')}
                icon={StickyNote}
                label="Notes"
              />
            </div>

            {/* Mobile Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {mobileTab === 'outline' && (
                <MobileOutlineTab
                  course={course}
                  modules={modules}
                  completedIds={completedIds}
                  allLessons={allLessons}
                  onLessonClick={() => setMobileSidebarOpen(false)}
                />
              )}
              {mobileTab === 'resources' && (
                <MobileResourcesTab courseId={course.id} />
              )}
              {mobileTab === 'notes' && (
                <MobileNotesTab courseId={course.id} />
              )}
            </div>
          </aside>
        </>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden mb-6">
          <div className="aspect-[3/1] bg-slate-100 relative">
            <CourseThumbnail
              thumbnailKey={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full bg-gradient-to-br from-cyan-50 to-slate-100"
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-[10px] uppercase font-black text-[#ddb049] tracking-widest mb-1">
              {course.category?.replace('_', ' ') || 'Course'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 sm:gap-6 flex-wrap mb-4 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {totalCount} lesson{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Your Progress
                </span>
                <span className="text-xs font-black text-slate-900">
                  {completedCount} / {totalCount} lessons ({percentage}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ddb049] to-[#20B486] rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Action button */}
            {isComplete ? (
              <Link
                href={`/certificate/${course.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 border-b-[3px] border-amber-600 text-slate-900 text-sm font-bold shadow-sm cursor-pointer transition-all hover:translate-y-[1px] hover:border-b-[1px]"
              >
                <Award className="w-4 h-4" />
                <span>Get Your Certificate</span>
              </Link>
            ) : nextLesson ? (
              <Link
                href={`/learn/${course.id}/${nextLesson.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold shadow-sm cursor-pointer transition-all hover:translate-y-[1px] hover:border-b-[1px]"
              >
                <Play className="w-4 h-4" />
                <span>
                  {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                </span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No content available yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Course Content
            </h2>
            {modules.map((mod, i) => (
              <ModuleAccordion
                key={mod.id}
                module={mod}
                index={i}
                courseId={course.id}
                completedIds={completedIds}
                defaultOpen={
                  i === 0 ||
                  mod.lessons.some((l: any) => !completedIds.has(l.id))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ModuleAccordion = ({
  module,
  index,
  courseId,
  completedIds,
  defaultOpen,
}: any) => {
  const [open, setOpen] = useState(defaultOpen);
  const lessons = module.lessons || [];
  const completedInModule = lessons.filter((l: any) =>
    completedIds.has(l.id)
  ).length;
  const totalDuration = lessons.reduce(
    (s: number, l: any) => s + (l.duration_seconds || 0),
    0
  );
  const durationMin = Math.round(totalDuration / 60);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[#fbfaf7] transition-colors cursor-pointer text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-slate-700">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-0.5">
            Module {index + 1}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
            {module.title}
          </h3>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {completedInModule} of {lessons.length} lessons complete · {durationMin}{' '}
            min
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {lessons.length > 0 && completedInModule === lessons.length && (
            <CheckCircle2 className="w-5 h-5 text-[#20B486]" />
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#f0ebe2]">
          {lessons.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No lessons in this module yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map((l: any, i: number) => {
                const done = completedIds.has(l.id);
                const isMulti = l.lesson_type === 'mixed';
                const duration = l.duration_seconds || 0;
                const mins = Math.floor(duration / 60);
                const secs = duration % 60;

                return (
                  <Link
                    key={l.id}
                    href={`/learn/${courseId}/${l.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-[#fbfaf7] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-black text-slate-400 w-8 text-center shrink-0">
                      {index + 1}.{i + 1}
                    </div>

                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#20B486] shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {l.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          {isMulti ? (
                            <>
                              <Play className="w-3 h-3 text-[#ddb049]" />
                              <FileText className="w-3 h-3 text-[#20B486]" />
                              <span className="capitalize">Mixed Content</span>
                            </>
                          ) : l.lesson_type === 'video' ? (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Video</span>
                            </>
                          ) : l.lesson_type === 'text' ? (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>Text</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3 h-3" />
                              <span>Quiz</span>
                            </>
                          )}
                        </div>
                        {duration > 0 && l.lesson_type !== 'quiz' && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>
                              {mins}:{String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────── MOBILE SIDEBAR COMPONENTS ───────

const MobileTabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black cursor-pointer transition-all border-b-2 ${
      active
        ? 'text-[#ddb049] border-[#ddb049]'
        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-[#fbfaf7]'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

const MobileOutlineTab = ({ course, modules, completedIds, allLessons, onLessonClick }: any) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const initialExpanded: Record<string, boolean> = {};
  modules.forEach((m: any) => {
    // Find current lesson from allLessons
    const currentLesson = allLessons.find((l: any) => l.id === m.lessons?.[0]?.id);
    // For simplicity, expand first module by default
    initialExpanded[m.id] = m === modules[0];
  });
  const mergedExpanded = { ...initialExpanded, ...expanded };

  const q = search.trim().toLowerCase();
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="p-4 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lessons..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7] text-sm"
        />
      </div>

      <div className="space-y-2">
        {modules.map((mod: any, mi: number) => {
          const lessons = mod.lessons || [];
          const filtered = q
            ? lessons.filter((l: any) => l.title.toLowerCase().includes(q))
            : lessons;
          if (q && filtered.length === 0) return null;

          const doneInMod = lessons.filter((l: any) => completedIds.has(l.id)).length;
          const isOpen = q ? true : mergedExpanded[mod.id];

          return (
            <div key={mod.id} className="border border-[#e8e0d2] rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[#fbfaf7] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-slate-700">{mi + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">
                    Module {mi + 1}
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate leading-tight">
                    {mod.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {doneInMod}/{lessons.length}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="bg-[#fbfaf7] border-t border-[#f0ebe2]">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 text-center font-medium">
                      No lessons
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filtered.map((l: any, li: number) => {
                        const isDone = completedIds.has(l.id);

                        return (
                          <button
                            key={l.id}
                            onClick={() => onLessonClick()}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all w-full text-left ${
                              isDone
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'hover:bg-white border border-transparent'
                            }`}
                          >
                            {isDone ? (
                              <div className="w-5 h-5 rounded-full bg-[#ddb049] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate text-slate-900">
                                {mi + 1}.{li + 1} {l.title}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                                {l.lesson_type === 'video' ? (
                                  <>
                                    <Play className="w-2.5 h-2.5" />
                                    <span>Video</span>
                                  </>
                                ) : l.lesson_type === 'text' ? (
                                  <>
                                    <FileText className="w-2.5 h-2.5" />
                                    <span>Text</span>
                                  </>
                                ) : (
                                  <>
                                    <HelpCircle className="w-2.5 h-2.5" />
                                    <span>Quiz</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            No content available
          </div>
        )}
      </div>
    </div>
  );
};

const MobileResourcesTab = ({ courseId }: any) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources?courseId=${courseId}`);
        const data = await res.json();
        setResources(data.resources || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
          Course Resources
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#e8e0d2] rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No resources for this course</p>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.download_url || r.external_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#fbfaf7] hover:bg-slate-100 border border-[#e8e0d2] cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e0d2] flex items-center justify-center shrink-0">
                <FileText
                  className={`w-4 h-4 ${
                    r.resource_type === 'link' ? 'text-[#ddb049]' : 'text-[#F86BCF]'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{r.title}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {r.resource_type === 'link' ? 'External Link' : r.resource_type?.toUpperCase()}
                </div>
              </div>
              {r.resource_type === 'link' ? (
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#ddb049] shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-slate-400 group-hover:text-[#F86BCF] shrink-0" />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileNotesTab = ({ courseId }: any) => {
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // For course overview, we'll use a general course note
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notes?courseId=${courseId}`);
        const data = await res.json();
        if (data.notes && data.notes.length > 0) {
          setNote(data.notes[0].content);
          setNoteId(data.notes[0].id);
        } else {
          setNote('');
          setNoteId(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleChange = (value: string) => {
    setNote(value);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      autoSave(value);
    }, 1500);
    setAutoSaveTimer(timer);
  };

  const autoSave = async (content: string) => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (noteId) {
        await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, content: content.trim() }),
        });
        const data = await res.json();
        if (data.note) setNoteId(data.note.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!note.trim()) {
      toast.error('Note is empty');
      return;
    }
    await autoSave(note);
    toast.success('Note saved!');
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
          Course Notes
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your course notes here... They will be saved automatically."
            className="flex-1 min-h-[300px] px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7] text-sm resize-none font-medium leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-[10px] text-slate-500 font-medium">
              {note.length} characters
            </div>
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};