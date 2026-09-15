'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleCard } from './ModuleCard';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  courseId: string;
}

export const ModulesBuilder: React.FC<Props> = ({ courseId }) => {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const [creatingLessonInModule, setCreatingLessonInModule] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/modules?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to load modules');
        return;
      }
      setModules(data.modules || []);
    } catch {
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const addModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error('Module title required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title: newModuleTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed');
        return;
      }
      toast.success('Module added');
      setNewModuleTitle('');
      setAddingModule(false);
      fetchModules();
    } finally {
      setCreating(false);
    }
  };

  const moveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const newModules = [...modules];
    [newModules[index], newModules[targetIdx]] = [newModules[targetIdx], newModules[index]];

    const moduleOrders = newModules.map((m, i) => ({ id: m.id, order_index: i }));

    try {
      const res = await fetch('/api/admin/modules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleOrders }),
      });
      if (!res.ok) {
        toast.error('Failed to reorder');
        return;
      }
      fetchModules();
    } catch {}
  };

  // Auto-creates a blank lesson AND redirects to full-screen editor
  const createBlankLesson = async (moduleId: string) => {
    setCreatingLessonInModule(moduleId);
    try {
      const module = modules.find((m) => m.id === moduleId);
      const orderIndex = module?.lessons?.length || 0;

      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId,
          title: `New Lesson ${orderIndex + 1}`,
          textContent: '<p>Add your content here...</p>',
          orderIndex,
          durationSeconds: 60,
          isPublished: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create lesson');
        return;
      }

      toast.success('Lesson created! Opening editor...');
      router.push(`/${PORTAL_SLUG}/courses/${courseId}/lessons/${data.lesson.id}`);
    } finally {
      setCreatingLessonInModule(null);
    }
  };

  const openLessonEditor = (lessonId: string) => {
    router.push(`/${PORTAL_SLUG}/courses/${courseId}/lessons/${lessonId}`);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ddb049]" />
            <span>Curriculum</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {modules.length} module{modules.length !== 1 ? 's' : ''} · Add modules and lessons
          </p>
        </div>

        {!addingModule && (
          <button
            onClick={() => setAddingModule(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        )}
      </div>

      {addingModule && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            New Module Title
          </label>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Module 2: Advanced Techniques"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addModule()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7]/50 text-sm min-w-[200px]"
            />
            <button
              onClick={addModule}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create</span>
            </button>
            <button
              onClick={() => {
                setAddingModule(false);
                setNewModuleTitle('');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e8e0d2] p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-900 mb-1">No modules yet</h3>
          <p className="text-sm text-slate-500 font-medium mb-5">
            Modules are containers that group your lessons
          </p>
          <button
            onClick={() => setAddingModule(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Module</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => (
            <ModuleCard
              key={m.id}
              module={m}
              index={i}
              totalModules={modules.length}
              onEditLesson={(lesson) => openLessonEditor(lesson.id)}
              onAddLesson={() => createBlankLesson(m.id)}
              onModuleUpdated={fetchModules}
              onMoveModuleUp={() => moveModule(i, 'up')}
              onMoveModuleDown={() => moveModule(i, 'down')}
              creatingLesson={creatingLessonInModule === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};