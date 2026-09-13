'use client';

import React from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export type QuestionType = 'single' | 'true_false' | 'multi';

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  options: QuizOption[];
}

export interface QuizData {
  passing_score?: number;
  questions: QuizQuestion[];
}

interface Props {
  data: QuizData;
  onChange: (data: QuizData) => void;
}

export const QuizBuilder: React.FC<Props> = ({ data, onChange }) => {
  const questions = data.questions || [];

  const update = (patch: Partial<QuizData>) => {
    onChange({ ...data, ...patch });
  };

  const addQuestion = (type: QuestionType) => {
    let newOptions: QuizOption[] = [];

    if (type === 'true_false') {
      newOptions = [
        { id: uuidv4(), text: 'True', is_correct: true },
        { id: uuidv4(), text: 'False', is_correct: false },
      ];
    } else {
      newOptions = [
        { id: uuidv4(), text: '', is_correct: true },
        { id: uuidv4(), text: '', is_correct: false },
      ];
    }

    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      type,
      question: '',
      explanation: '',
      options: newOptions,
    };

    update({ questions: [...questions, newQuestion] });
  };

  const updateQuestion = (qId: string, patch: Partial<QuizQuestion>) => {
    update({
      questions: questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    });
  };

  const deleteQuestion = (qId: string) => {
    if (!confirm('Delete this question?')) return;
    update({ questions: questions.filter((q) => q.id !== qId) });
  };

  const addOption = (qId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q || q.type === 'true_false') return;
    updateQuestion(qId, {
      options: [...q.options, { id: uuidv4(), text: '', is_correct: false }],
    });
  };

  const updateOption = (qId: string, oId: string, patch: Partial<QuizOption>) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;

    let newOptions = q.options.map((o) => (o.id === oId ? { ...o, ...patch } : o));

    if ((q.type === 'single' || q.type === 'true_false') && patch.is_correct === true) {
      newOptions = newOptions.map((o) => ({ ...o, is_correct: o.id === oId }));
    }

    updateQuestion(qId, { options: newOptions });
  };

  const deleteOption = (qId: string, oId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;
    if (q.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    updateQuestion(qId, { options: q.options.filter((o) => o.id !== oId) });
  };

  return (
    <div className="space-y-5">
      {/* NO passing score field anymore */}

      {questions.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 mb-1">No questions yet</p>
          <p className="text-xs text-slate-500 font-medium">Add your first question below</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border ${
                        q.type === 'single'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
                          : q.type === 'true_false'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}
                    >
                      {q.type === 'single'
                        ? 'Multiple Choice'
                        : q.type === 'true_false'
                        ? 'True / False'
                        : 'Multi-Select'}
                    </span>
                  </div>
                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder="Type your question here..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white text-sm font-medium resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-10 mb-4">
                <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2">
                  {q.type === 'multi'
                    ? 'Options (check ALL correct answers)'
                    : 'Options (select 1 correct answer)'}
                </div>

                {q.options.map((opt, oi) => (
                  <div key={opt.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() =>
                        updateOption(q.id, opt.id, { is_correct: !opt.is_correct })
                      }
                      className={`p-1 rounded-lg cursor-pointer transition-all shrink-0 ${
                        opt.is_correct
                          ? 'text-emerald-600 hover:bg-emerald-100'
                          : 'text-slate-300 hover:bg-slate-100'
                      }`}
                      title={opt.is_correct ? 'Correct answer' : 'Mark as correct'}
                    >
                      {opt.is_correct ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                      placeholder={`Option ${oi + 1}`}
                      disabled={q.type === 'true_false'}
                      className={`flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white text-sm font-medium ${
                        opt.is_correct
                          ? 'ring-1 ring-emerald-200 bg-emerald-50/30'
                          : ''
                      } ${q.type === 'true_false' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />

                    {q.type !== 'true_false' && q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => deleteOption(q.id, opt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {q.type !== 'true_false' && (
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add option</span>
                  </button>
                )}
              </div>

              {/* Answer Explanation */}
              <div className="pl-10">
                <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                  <MessageSquare className="w-3 h-3" />
                  <span>Answer Explanation (shown after student submits)</span>
                </label>
                <textarea
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  placeholder="Explain why the correct answer is right..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white text-sm font-medium resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add question buttons */}
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-3 text-center">
          Add New Question
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => addQuestion('single')}
            className="py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 text-cyan-700 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Multiple Choice</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('true_false')}
            className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>True / False</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('multi')}
            className="py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-700 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Multi-Select</span>
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="text-xs text-slate-500 font-medium text-center">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};