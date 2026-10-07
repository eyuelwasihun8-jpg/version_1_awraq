'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  XCircle,
  Loader2,
  Calendar,
  User,
  BookOpen,
  Award,
  Search,
} from 'lucide-react';

export interface CertificateVerificationProps {
  code: string;
  initialCert?: any;
}

export const CertificateVerification: React.FC<CertificateVerificationProps> = ({
  code,
  initialCert,
}) => {
  const [inputCode, setInputCode] = useState(code);
  const [loading, setLoading] = useState(!initialCert);
  const [certData, setCertData] = useState<any>(initialCert || null);
  const [error, setError] = useState<string | null>(null);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/certificate/verify/${codeToVerify.trim()}`);
      const json = await res.json();
      if (!res.ok || !json.valid) {
        setError(json.error || 'Certificate not found or invalid');
        setCertData(null);
      } else {
        setCertData(json.certificate);
      }
    } catch {
      setError('Failed to verify certificate. Please try again.');
      setCertData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialCert && code) {
      verifyCode(code);
    }
  }, [code, initialCert]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      verifyCode(inputCode.trim());
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Enter Certificate Code (e.g. CERT-2026-ABC123)..."
          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none bg-white font-mono text-sm shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#ddb049] text-[#0a0704] hover:bg-[#c99a3a] cursor-pointer"
          title="Verify Code"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Verification Results */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-[#e8e0d2] shadow-xl text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ddb049] mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Verifying certificate authenticity...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">
              Invalid Certificate
            </h2>
            <p className="text-sm text-slate-600 font-medium">{error}</p>
          </div>
        </div>
      ) : certData ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-[#f0ebe2]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-emerald-700">
                Official Credential
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Verified Authentic Certificate
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <ResultRow
              icon={User}
              label="Recipient"
              value={certData.studentName}
            />
            <ResultRow
              icon={BookOpen}
              label="Course"
              value={certData.courseName}
            />
            <ResultRow
              icon={Award}
              label="Instructor"
              value={certData.instructorName}
            />
            <ResultRow
              icon={Calendar}
              label="Issue Date"
              value={certData.issueDate}
            />
            <ResultRow
              icon={ShieldCheck}
              label="Certificate ID"
              value={certData.certificateId}
              mono
            />
          </div>

          <div className="pt-4 border-t border-[#f0ebe2] text-center">
            <p className="text-xs text-slate-500 font-medium">
              Issued by <span className="font-bold text-slate-900">Awraq Skills</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ResultRow = ({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fbfaf7] border border-[#f0ebe2]">
    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
    <div className="min-w-0 flex-1 flex justify-between items-center gap-2">
      <span className="text-xs font-medium text-slate-500">{label}:</span>
      <span
        className={`text-sm font-bold text-slate-900 truncate ${
          mono ? 'font-mono text-[#ddb049]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  </div>
);