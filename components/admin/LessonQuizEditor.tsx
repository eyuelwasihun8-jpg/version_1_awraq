'use client';

import React, { useState } from 'react';
import { HelpCircle, Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { QuizBuilder, QuizData } from './QuizBuilder';

interface Props {
  lesson: any;
  onSaved: () => void;
}

export const LessonQuizEditor: React.FC<Props> = ({ lesson, onSaved }) => {
  const [quizData, setQuizData] = useState<QuizData>(
    (lesson.quiz_data as QuizData) || { questions: [] }
  );
  const [saving, setSaving] = useState(false);

  const questionCount = quizData.questions?.length || 0;
  const hasQuestions = questionCount > 0;
  const hasChanges = JSON.stringify(lesson.quiz_data || {}) !== JSON.stringify(quizData);

  const validate = () => {
    if (!hasQuestions) {
      toast.error('Add at least one question');
      return false;
    }
    for (const q of quizData.questions) {
      if (!q.question.trim()) {
        toast.error('Some questions are empty');
        return false;
      }
      if (!q.options.some((o) => o.is_correct)) {
        toast.error(`Mark a correct answer for: "${q.question.substring(0, 40)}"`);
        return false;
      }
      if (q.type !== 'true_false' && q.options.some((o) => !o.text.trim())) {
        toast.error(`Empty option in: "${q.question.substring(0, 40)}"`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Quiz saved!');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the quiz from this lesson?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData: null }),
      });
      if (!res.ok) {
        toast.error('Failed to remove');
        return;
      }
      toast.success('Quiz removed');
      setQuizData({ questions: [] });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Quiz Section</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Add questions and mark correct answers. Add explanations so students learn after submitting.
            </p>
          </div>
        </div>

        <QuizBuilder data={quizData} onChange={setQuizData} />

        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving || !hasQuestions || !hasChanges}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 border-b-[3px] border-purple-800 text-white text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Quiz Section'}</span>
          </button>

          {lesson.quiz_data && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Quiz
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