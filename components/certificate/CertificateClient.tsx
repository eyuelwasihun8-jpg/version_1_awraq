'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Loader2, Download, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  course: any;
  defaultName: string;
}

export const CertificateClient: React.FC<Props> = ({ course, defaultName }) => {
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [alreadyIssued, setAlreadyIssued] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [studentName, setStudentName] = useState(defaultName);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/certificate/check?courseId=${course.id}`);
        const data = await res.json();
        if (data.eligible) {
          setEligible(true);
          if (data.alreadyIssued) {
            setAlreadyIssued(true);
            setCertificate(data.certificate);
            setStudentName(data.certificate.student_name);
          }
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [course.id]);

  const handleGenerate = async () => {
    if (!studentName.trim() || studentName.trim().length < 3) {
      toast.error('Please enter your full name (min 3 characters)');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, studentName: studentName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate');
        return;
      }

      setCertificate(data.certificate);
      setAlreadyIssued(true);
      toast.success('Certificate generated!');

      // Auto-download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/certificate/download?courseId=${course.id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error('Failed to get download link');
        return;
      }
      window.open(data.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#07CCFD]" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Not Eligible Yet</h1>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Complete all lessons in this course to earn your certificate.
          </p>
          <Link
            href={`/learn/${course.id}`}
            className="inline-block px-5 py-3 rounded-xl bg-[#07CCFD] text-[#0F172A] text-sm font-bold cursor-pointer"
          >
            Continue Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/learn/${course.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              🎉 Congratulations!
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              You've completed <span className="font-bold text-slate-900">{course.title}</span>
            </p>
          </div>

          {alreadyIssued ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-black text-emerald-900">Certificate Issued</span>
                </div>
                <div className="text-xs text-emerald-800 font-medium">
                  Issued to <span className="font-bold">{certificate?.student_name}</span> on{' '}
                  {new Date(certificate?.issued_at).toLocaleDateString()}
                </div>
                {certificate?.certificate_code && (
                  <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-white/60 rounded-lg px-2 py-1 inline-block">
                    Code: {certificate.certificate_code}
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{downloading ? 'Preparing...' : 'Download Certificate PDF'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Full Name (as it will appear on the certificate) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Sarah Kebede"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This name is permanent. Please double-check spelling.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !studentName.trim()}
                className="w-full min-h-[52px] py-4 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 border-b-[4px] border-amber-600 hover:border-b-[2px] hover:translate-y-[2px] text-slate-900 text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating your certificate...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Generate My Certificate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};