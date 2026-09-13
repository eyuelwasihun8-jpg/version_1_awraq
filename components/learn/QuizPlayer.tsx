'use client';

import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  Check,
  RotateCcw,
  Award,
  ChevronRight,
  History,
  MessageSquare,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuizOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'single' | 'true_false' | 'multi';
  question: string;
  explanation?: string;
  options: QuizOption[];
}

interface QuizData {
  passing_score?: number;
  questions: QuizQuestion[];
}

interface Props {
  lessonId: string;
  quizData: QuizData;
  onCompleted: () => void;
}

export const QuizPlayer: React.FC<Props> = ({ lessonId, quizData, onCompleted }) => {
  const questions = quizData?.questions || [];

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/quiz/submit?lessonId=${lessonId}`);
        const data = await res.json();
        setPastAttempts(data.attempts || []);
      } finally {
        setLoadingAttempts(false);
      }
    })();
  }, [lessonId]);

  const toggleAnswer = (qId: string, oId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const current = prev[qId] || [];
      if (isMulti) {
        return {
          ...prev,
          [qId]: current.includes(oId)
            ? current.filter((x) => x !== oId)
            : [...current, oId],
        };
      }
      return { ...prev, [qId]: [oId] };
    });
  };

  const answeredCount = Object.values(answers).filter((v) => v.length > 0).length;

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      if (
        !confirm(
          `You've answered ${answeredCount} of ${questions.length} questions. Submit anyway?`
        )
      ) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        lessonId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] || [],
        })),
      };

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit');
        return;
      }

      setResult(data);
      onCompleted();

      const attemptsRes = await fetch(`/api/quiz/submit?lessonId=${lessonId}`);
      const attemptsData = await attemptsRes.json();
      setPastAttempts(attemptsData.attempts || []);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setShowPast(false);
  };

  // ─── RESULT SCREEN ───
  if (result) {
    const score = result.score;
    const isGreat = score >= 80;
    const isGood = score >= 60;

    return (
      <div className="p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Score card */}
          <div
            className={`rounded-2xl p-6 sm:p-8 mb-6 text-center border-2 ${
              isGreat
                ? 'bg-emerald-50 border-emerald-200'
                : isGood
                ? 'bg-cyan-50 border-cyan-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div
              className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                isGreat
                  ? 'bg-[#20B486]'
                  : isGood
                  ? 'bg-[#07CCFD]'
                  : 'bg-amber-500'
              }`}
            >
              {isGreat ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : isGood ? (
                <Award className="w-10 h-10 text-white" />
              ) : (
                <RotateCcw className="w-10 h-10 text-white" />
              )}
            </div>

            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
              {isGreat ? 'Excellent!' : isGood ? 'Good Job!' : 'Keep Practicing'}
            </div>
            <div className="text-5xl font-black text-slate-900 mb-1">{score}%</div>
            <div className="text-sm text-slate-600 font-medium">
              {result.correctCount} out of {result.totalQuestions} correct
            </div>
          </div>

          {/* Question review with explanations */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-black text-slate-900">Question Review</h3>
            {questions.map((q, i) => {
              const feedback = result.feedback.find((f: any) => f.questionId === q.id);
              const isCorrect = feedback?.isCorrect;
              const correctIds = new Set<string>(feedback?.correctOptionIds || []);
              const selectedIds = new Set<string>(feedback?.selectedOptionIds || []);
              const explanation = q.explanation;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border-2 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">
                        Question {i + 1}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{q.question}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-8 mb-3">
                    {q.options.map((opt) => {
                      const wasSelected = selectedIds.has(opt.id);
                      const isCorrectOpt = correctIds.has(opt.id);

                      let cls = 'bg-white border-slate-200 text-slate-600';
                      if (isCorrectOpt) {
                        cls = 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold';
                      } else if (wasSelected && !isCorrectOpt) {
                        cls = 'bg-red-100 border-red-300 text-red-900 font-bold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${cls}`}
                        >
                          {isCorrectOpt ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : wasSelected ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="flex-1">{opt.text}</span>
                          {wasSelected && !isCorrectOpt && (
                            <span className="text-[10px] uppercase font-black shrink-0">
                              Your answer
                            </span>
                          )}
                          {isCorrectOpt && (
                            <span className="text-[10px] uppercase font-black shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {explanation && explanation.trim() && (
                    <div className="pl-8 mt-3 pt-3 border-t border-slate-200">
                      <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>Explanation</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white rounded-lg p-3 border border-slate-200">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRetry}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Quiz Again</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── EMPTY QUIZ ───
  if (questions.length === 0) {
    return (
      <div className="p-10 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-500">No questions in this quiz yet</p>
      </div>
    );
  }

  // ─── QUIZ FORM ───
  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-[10px] uppercase font-black text-purple-600 tracking-widest">
              Practice Quiz · {questions.length} Question{questions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Optional practice · Try as many times as you want to learn
          </p>

          {!loadingAttempts && pastAttempts.length > 0 && (
            <button
              onClick={() => setShowPast(!showPast)}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#07CCFD] hover:underline cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>
                {showPast ? 'Hide' : 'View'} {pastAttempts.length} past attempt
                {pastAttempts.length !== 1 ? 's' : ''}
              </span>
            </button>
          )}

          {showPast && pastAttempts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {pastAttempts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-slate-900">{a.score}%</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({Math.round((a.score / 100) * (a.answers?.length || 0))}/{a.answers?.length || 0} correct)
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-medium">
                    {new Date(a.attempted_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-700">
            {answeredCount} of {questions.length} answered
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase font-black tracking-wider mb-1 text-slate-500">
                    {q.type === 'multi' ? 'Select all that apply' : 'Select one'}
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {q.question}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-10">
                {q.options.map((opt) => {
                  const isSelected = (answers[q.id] || []).includes(opt.id);
                  const isMulti = q.type === 'multi';

                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleAnswer(q.id, opt.id, isMulti)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${
                        isSelected
                          ? 'border-[#07CCFD] bg-cyan-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isMulti ? (
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#07CCFD] bg-[#07CCFD]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#07CCFD]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#07CCFD]" />}
                        </div>
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="w-full mt-6 min-h-[52px] py-4 rounded-xl bg-purple-600 hover:bg-purple-700 border-b-[4px] border-purple-800 hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Grading...</span>
            </>
          ) : (
            <>
              <span>Submit Quiz</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};