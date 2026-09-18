'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, Loader2, Download, ShieldCheck } from 'lucide-react';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';
import { downloadCertificatePdf } from '@/lib/certificates/certificate-generator';
import type { CertificateData } from '@/components/certificates/types';
import { toast } from 'sonner';

export default function StudentCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const res = await fetch('/api/certificate/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to load certificate');
          setLoading(false);
          return;
        }

        setCertData(json.data);
      } catch {
        setError('Network error while fetching certificate.');
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [courseId]);

  const handleDownload = async () => {
    if (!previewRef.current || !certData) return;
    setDownloading(true);
    try {
      const templateEl = previewRef.current.querySelector(
        '.certificate'
      ) as HTMLElement;
      if (templateEl) {
        await downloadCertificatePdf(certData.certificateId, templateEl);
        toast.success('Certificate PDF downloaded!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#ddb049] animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Verifying completion & loading certificate...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error / locked state ───
  if (error || !certData) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#e8e0d2] text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Award className="w-7 h-7 text-[#ddb049]" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            Certificate Locked
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'Please complete all lessons first.'}
          </p>
          <Link
            href={`/learn/${courseId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ddb049] text-[#0a0704] font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // ─── Certificate ready ───
  return (
    <div className="min-h-screen bg-[#fbfaf7] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* ═══ TOP BAR: Back link + Download button ═══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Link
            href={`/learn/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] font-black text-sm shadow-[0_8px_20px_rgba(221,176,73,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>

        {/* ═══ CERTIFICATE DISPLAY ═══ */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-[#e8e0d2] shadow-2xl overflow-x-auto flex justify-center">
          <div
            ref={previewRef}
            className="shrink-0 shadow-lg rounded-xl overflow-hidden"
          >
            <CertificateTemplate data={certData} />
          </div>
        </div>

        {/* ═══ BOTTOM: Second Download button + verify info ═══ */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] font-black text-base shadow-[0_8px_24px_rgba(221,176,73,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>
              {downloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}
            </span>
          </button>

          {/* Verification info card */}
          <div className="w-full max-w-xl bg-white rounded-2xl border border-[#e8e0d2] p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                Publicly Verifiable
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Anyone can confirm this certificate is authentic by visiting:
            </p>
            <a
              href={certData.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-bold text-[#ddb049] hover:underline break-all"
            >
              {certData.verificationUrl}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}