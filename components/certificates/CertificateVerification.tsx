'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldX, ArrowLeft, Award } from 'lucide-react';
import QRCode from 'qrcode';
import { CertificateTemplate } from './CertificateTemplate';
import type { CertificateData } from './types';

interface CertificateVerificationProps {
  certificateId: string;
  data?: CertificateData;
}

export function CertificateVerification({
  certificateId,
  data,
}: CertificateVerificationProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.verificationUrl) {
      QRCode.toDataURL(data.verificationUrl, { width: 200, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [data]);

  // Case 1: Certificate Not Found / Invalid
  if (!data) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#e8e0d2] text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            Verification Failed
          </span>

          <h1 className="text-2xl font-black text-slate-900 mt-3 mb-2">
            Invalid Certificate
          </h1>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            No active certificate matching code{' '}
            <code className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {certificateId}
            </code>{' '}
            was found in our records.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0a0704] text-white font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Awraq Home
          </Link>
        </div>
      </main>
    );
  }

  // Case 2: Certificate Valid (Public View)
  return (
    <main className="min-h-screen bg-[#fbfaf7] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link -> Always goes directly to Home page / */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Awraq
        </Link>

        {/* Verification Status Card */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d2] shadow-xl">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#e8e0d2]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Verification Complete
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                Authentic Certificate
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Issued by {data.organizationName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Details List */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Student Name</span>
                <span className="text-sm font-black text-slate-900">{data.studentName}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Course</span>
                <span className="text-sm font-black text-slate-900">{data.courseName}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Instructor</span>
                <span className="text-sm font-black text-slate-900">{data.instructorName}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Issued On</span>
                <span className="text-sm font-black text-slate-900">{data.issueDate}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5">
                <span className="text-xs font-bold text-slate-500">Certificate Code</span>
                <span className="text-sm font-mono font-black text-[#ddb049]">{data.certificateId}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#fbfaf7] rounded-2xl border border-[#e8e0d2]">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Verification QR Code"
                  className="w-32 h-32 rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-lg" />
              )}
              <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                Scan to Verify
              </span>
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#ddb049]" />
            <h2 className="text-lg font-black text-slate-900">Certificate Preview</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#e8e0d2] shadow-xl overflow-x-auto flex justify-center">
            <div ref={previewRef} className="shrink-0 shadow-lg rounded-xl overflow-hidden">
              <CertificateTemplate data={data} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}