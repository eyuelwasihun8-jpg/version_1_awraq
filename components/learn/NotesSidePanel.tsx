'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, StickyNote, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  lessonId: string;
}

export const NotesSidePanel: React.FC<Props> = ({ courseId, lessonId }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?lessonId=${lessonId}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [lessonId]);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId, content: newNote.trim() }),
      });
      if (!res.ok) {
        toast.error('Failed to save');
        return;
      }
      setNewNote('');
      fetchNotes();
      toast.success('Note saved');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) return toast.error('Failed');
      fetchNotes();
      toast.success('Deleted');
    } catch {}
  };

  return (
    <div>
      <div className="mb-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note about this lesson..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7]/50 text-sm resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newNote.trim() || adding}
          className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{adding ? 'Saving...' : 'Save Note'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6">
          <StickyNote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="p-3 bg-amber-50 border border-amber-200 rounded-xl group relative"
            >
              <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap pr-6">
                {n.content}
              </p>
              <div className="text-[10px] text-slate-500 font-medium mt-2">
                {new Date(n.created_at).toLocaleString()}
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="absolute top-2 right-2 p-1 rounded-lg text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};