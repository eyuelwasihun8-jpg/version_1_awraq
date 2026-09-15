'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  StickyNote,
  Search,
  PanelLeftClose,
  Play,
  FileText,
  HelpCircle,
  Circle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'outline' | 'resources' | 'notes';

interface Props {
  course: any;
  modules: any[];
  currentLessonId: string;
  completedIds: Set<string>;
  sidebarOpen: boolean;
  onClose: () => void;
}

export const LessonSidebar: React.FC<Props> = ({
  course,
  modules,
  currentLessonId,
  completedIds,
  sidebarOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<TabType>('outline');

  let currentLessonTitle = '';
  for (const m of modules) {
    const l = (m.lessons || []).find((x: any) => x.id === currentLessonId);
    if (l) {
      currentLessonTitle = l.title;
      break;
    }
  }

  if (!sidebarOpen) return null;

  return (
    <aside className="hidden lg:flex flex-col w-[380px] bg-white border-r border-[#e8e0d2] overflow-hidden shrink-0">
      <div className="p-5 border-b border-[#f0ebe2] flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
            Course
          </div>
          <h2 className="text-lg font-black text-slate-900 leading-tight">Content</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          title="Hide sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#f0ebe2]">
        <TabButton
          active={tab === 'outline'}
          onClick={() => setTab('outline')}
          icon={BookOpen}
          label="Outline"
        />
        <TabButton
          active={tab === 'resources'}
          onClick={() => setTab('resources')}
          icon={Download}
          label="Resources"
        />
        <TabButton
          active={tab === 'notes'}
          onClick={() => setTab('notes')}
          icon={StickyNote}
          label="Notes"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'outline' && (
          <OutlineTab
            course={course}
            modules={modules}
            completedIds={completedIds}
            currentLessonId={currentLessonId}
          />
        )}
        {tab === 'resources' && (
          <ResourcesTab lessonId={currentLessonId} lessonTitle={currentLessonTitle} />
        )}
        {tab === 'notes' && (
          <NotesTab
            courseId={course.id}
            lessonId={currentLessonId}
            lessonTitle={currentLessonTitle}
          />
        )}
      </div>
    </aside>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black cursor-pointer transition-all border-b-2 ${
      active
        ? 'text-[#ddb049] border-[#ddb049]'
        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-[#fbfaf7]'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

// ─────── OUTLINE ───────
const OutlineTab = ({ course, modules, completedIds, currentLessonId }: any) => {
  const [search, setSearch] = useState('');

  const initialExpanded: Record<string, boolean> = {};
  modules.forEach((m: any) => {
    initialExpanded[m.id] = (m.lessons || []).some(
      (l: any) => l.id === currentLessonId
    );
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const q = search.trim().toLowerCase();

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
          const isOpen = q ? true : expanded[mod.id];

          return (
            <div
              key={mod.id}
              className="border border-[#e8e0d2] rounded-xl overflow-hidden bg-white"
            >
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
                        const isCurrent = l.id === currentLessonId;
                        const isDone = completedIds.has(l.id);
                        const isMixed = l.lesson_type === 'mixed';
                        const duration = l.duration_seconds || 0;
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;

                        return (
                          <Link
                            key={l.id}
                            href={`/learn/${course.id}/${l.id}`}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${
                              isCurrent
                                ? 'bg-amber-50 border border-amber-200'
                                : 'hover:bg-white border border-transparent'
                            }`}
                          >
                            {isDone ? (
                              <div className="w-5 h-5 rounded-full bg-[#ddb049] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-5 h-5 rounded-full border-2 border-[#ddb049] flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ddb049]" />
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-bold truncate ${
                                  isCurrent ? 'text-[#ddb049]' : 'text-slate-900'
                                }`}
                              >
                                {mi + 1}.{li + 1} {l.title}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                                {isMixed ? (
                                  <>
                                    <div className="flex items-center gap-0.5">
                                      <Video className="w-2.5 h-2.5 text-[#ddb049]" />
                                      <FileText className="w-2.5 h-2.5 text-[#20B486]" />
                                      <HelpCircle className="w-2.5 h-2.5 text-purple-500" />
                                    </div>
                                    <span className="ml-1">Multi-content</span>
                                  </>
                                ) : l.lesson_type === 'video' ? (
                                  <>
                                    <Play className="w-2.5 h-2.5" />
                                    <span>
                                      {mins}:{String(secs).padStart(2, '0')}
                                    </span>
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
                          </Link>
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

// ─────── RESOURCES ───────
const ResourcesTab = ({ lessonId, lessonTitle }: any) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources?lessonId=${lessonId}`);
        const data = await res.json();
        setResources(data.resources || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
          Lesson Resources
        </div>
        <div className="text-xs text-slate-600 font-medium truncate">{lessonTitle}</div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#e8e0d2] rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No resources for this lesson</p>
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

// ─────── NOTES ───────
const NotesTab = ({ courseId, lessonId, lessonTitle }: any) => {
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notes?lessonId=${lessonId}`);
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
  }, [lessonId]);

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
          body: JSON.stringify({ courseId, lessonId, content: content.trim() }),
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
          Notes For
        </div>
        <div className="text-sm font-black text-slate-900 truncate">{lessonTitle}</div>
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
            placeholder="Write your notes here... They will be saved automatically."
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