'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PenTool, Trash2, Loader2, ArrowRight, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  enrolledCourses: any[];
  initialNotes: any[];
}

export const NotesTab: React.FC<Props> = ({ enrolledCourses, initialNotes }) => {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filterCourse === 'all') return notes;
    return notes.filter((n) => n.course_id === filterCourse);
  }, [notes, filterCourse]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Note deleted');
    } finally {
      setDeletingId(null);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">No notes yet</h3>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
          Take notes while learning to remember important concepts.
          {enrolledCourses.length > 0
            ? ' Start a lesson and write your thoughts.'
            : ' Enroll in a course to start taking notes.'}
        </p>
        {enrolledCourses.length > 0 ? (
          <Link
            href={`/learn/${enrolledCourses[0].id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#07CCFD] text-[#0F172A] text-sm font-bold cursor-pointer transition-all"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#07CCFD] text-[#0F172A] text-sm font-bold cursor-pointer transition-all"
          >
            <span>Browse Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Filter + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">Your Notes</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {filtered.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {enrolledCourses.length > 0 && (
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold cursor-pointer outline-none focus:border-[#07CCFD] appearance-none"
            >
              <option value="all">All Courses</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500 font-medium">No notes in this course</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((note) => {
            const courseTitle = note.courses?.title || 'Unknown Course';
            const lessonTitle = note.lessons?.title || 'Unknown Lesson';
            const isDeleting = deletingId === note.id;

            return (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md p-4 sm:p-5 group transition-all flex flex-col"
              >
                {/* Meta */}
                <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-black text-[#07CCFD] tracking-widest mb-0.5">
                      {courseTitle}
                    </div>
                    <div className="text-xs font-bold text-slate-700 truncate">{lessonTitle}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-all disabled:opacity-50"
                    title="Delete note"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap line-clamp-4">
                    {note.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(note.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    ·{' '}
                    {new Date(note.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() =>
                      router.push(`/learn/${note.course_id}/${note.lesson_id}`)
                    }
                    className="text-[11px] font-bold text-[#07CCFD] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Go to lesson</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};