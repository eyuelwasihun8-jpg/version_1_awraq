'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Download, Loader2, Copy, ExternalLink, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  certificates: any[];
  enrolledCourses: any[];
}

export const CertificatesTab: React.FC<Props> = ({ certificates, enrolledCourses }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (courseId: string) => {
    setDownloadingId(courseId);
    try {
      const res = await fetch(`/api/certificate/download?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error('Failed to fetch download link');
        return;
      }
      window.open(data.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Verification code copied!');
  };

  const copyVerifyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification link copied!');
  };

  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-8 sm:p-12 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">No certificates yet</h3>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
          Complete a course to earn your verified certificate.
        </p>
        {enrolledCourses.length > 0 ? (
          <Link
            href={`/learn/${enrolledCourses[0].id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ddb049] text-[#0a0704] text-sm font-bold cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Continue Learning</span>
          </Link>
        ) : (
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ddb049] text-[#0a0704] text-sm font-bold cursor-pointer"
          >
            <span>Browse Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">Your Certificates</h2>
        <span className="text-xs text-slate-500 font-medium">
          {certificates.length} earned
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {certificates.map((cert) => {
          const isDownloading = downloadingId === cert.course_id;
          return (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-md overflow-hidden transition-all"
            >
              {/* Preview banner */}
              <div className="aspect-[3/1] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 relative flex items-center justify-center">
                <Award className="w-20 h-20 text-white/40" />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-amber-900 border border-white shadow-md">
                  Certified
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-1">
                  Certificate of Completion
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2">
                  {cert.courses?.title || 'Course'}
                </h3>
                <div className="text-xs text-slate-500 font-medium mb-3">
                  Issued to <span className="font-bold text-slate-700">{cert.student_name}</span> on{' '}
                  {new Date(cert.issued_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                {cert.certificate_code && (
                  <div className="flex items-center gap-2 mb-4 bg-[#fbfaf7] rounded-lg px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                        Verification Code
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900 truncate">
                        {cert.certificate_code}
                      </div>
                    </div>
                    <button
                      onClick={() => copyCode(cert.certificate_code)}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-[#ddb049] cursor-pointer transition-colors"
                      title="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(cert.course_id)}
                    disabled={isDownloading}
                    className="flex-1 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Getting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                  {cert.certificate_code && (
                    <button
                      onClick={() => copyVerifyLink(cert.certificate_code)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                      title="Copy verify link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};