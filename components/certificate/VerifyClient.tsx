'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Props {
  code: string;
}

export const VerifyClient: React.FC<Props> = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/certificate/verify/${code}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Not found');
        } else {
          setData(json);
        }
      } catch {
        setError('Failed to verify');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#07CCFD]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {data?.valid ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-8 sm:p-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#20B486]" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">Certificate Verified ✓</h1>
              <p className="text-sm text-slate-500 font-medium">
                This certificate is authentic and issued by Awraq
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <Row label="Student" value={data.studentName} />
              <Row label="Course" value={data.courseName} />
              <Row label="Issued" value={new Date(data.issuedAt).toLocaleDateString()} />
              <Row label="Code" value={data.code} mono />
            </div>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-[#07CCFD] hover:underline cursor-pointer"
            >
              Visit Awraq
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Certificate Not Found</h1>
            <p className="text-sm text-slate-500 font-medium mb-6">
              {error || 'This certificate code is invalid or has been revoked.'}
            </p>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono text-slate-500 break-all">
              {code}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }: any) => (
  <div>
    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
      {label}
    </div>
    <div className={`text-sm font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);