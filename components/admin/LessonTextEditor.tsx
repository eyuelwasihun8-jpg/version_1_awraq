'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  lesson: any;
  onSaved: () => void;
}

export const LessonTextEditor: React.FC<Props> = ({ lesson, onSaved }) => {
  const [content, setContent] = useState(lesson.text_content || '');
  const [saving, setSaving] = useState(false);

  const stripped = content.replace(/<[^>]*>/g, '').trim();
  const wordCount = stripped ? stripped.split(/\s+/).length : 0;
  const estimatedTime = Math.max(60, Math.round((wordCount / 200) * 60));

  const hasContent = stripped.length > 0;
  const hasChanges = content !== (lesson.text_content || '');

  const handleSave = async () => {
    if (!hasContent) {
      toast.error('Please write some content first');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: content,
          durationSeconds: estimatedTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Text content saved!');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove all text content from this lesson?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: null }),
      });
      if (!res.ok) {
        toast.error('Failed to remove');
        return;
      }
      toast.success('Text content removed');
      setContent('');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-[#20B486]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Text Section</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Reading material for this lesson.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your lesson content..."
          />
        </div>

        {wordCount > 0 && (
          <div className="mb-5 text-xs text-slate-500 font-medium bg-[#fbfaf7] rounded-lg px-3 py-2 inline-block">
            <span className="font-bold text-slate-900">{wordCount}</span> word
            {wordCount !== 1 ? 's' : ''}
          </div>
        )}

        <div className="flex items-center gap-3 pt-5 border-t border-[#f0ebe2] flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving || !hasContent || !hasChanges}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#20B486] hover:bg-[#059669] border-b-[3px] border-[#047857] text-white text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Text Section'}</span>
          </button>

          {lesson.text_content && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Text
            </button>
          )}

          {hasChanges && (
            <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Unsaved changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};