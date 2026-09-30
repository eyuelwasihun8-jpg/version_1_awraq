'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import {
  Award,
  ArrowLeft,
  Loader2,
  Download,
  ShieldCheck,
  Star,
  Send,
} from 'lucide-react';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';
import { downloadCertificatePdf } from '@/lib/certificates/certificate-generator';
import type { CertificateData } from '@/components/certificates/types';
import { toast } from 'sonner';

const MIN_CHARS = 30;

export default function StudentCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);

  const loadCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check if student already submitted a review
      const reviewRes = await fetch(`/api/reviews?courseId=${courseId}&mine=1`);
      const reviewJson = await reviewRes.json();

      if (!reviewRes.ok) {
        setError(reviewJson.error || 'Failed to check review status');
        return;
      }

      if (!reviewJson.review) {
        setNeedsReview(true);
        setCertData(null);
        return;
      }

      setNeedsReview(false);

      // 2. Generate / load certificate
      const res = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to load certificate');
        return;
      }

      setCertData(json.data);
    } catch {
      setError('Network error while loading certificate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificate();
  }, [courseId]);

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Please select a star rating');
      return;
    }
    if (reviewText.trim().length < MIN_CHARS) {
      toast.error(`Please write at least ${MIN_CHARS} characters`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          rating,
          reviewText: reviewText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');

      toast.success('Thank you! Your certificate is unlocked.');
      setNeedsReview(false);
      await loadCertificate();
    } catch (err: any) {
      toast.error(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current || !certData) return;
    setDownloading(true);
    try {
      const templateEl = previewRef.current.querySelector('.certificate') as HTMLElement;
      if (templateEl) {
        await downloadCertificatePdf(certData, templateEl);
        toast.success('Certificate PDF downloaded!');
      } else {
        throw new Error('Certificate preview element not found');
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#ddb049] animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Verifying completion...
          </p>
        </div>
      </div>
    );
  }

  // ── REVIEW GATE ──────────────────────────────────────────
  if (needsReview) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#e8e0d2]">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Award className="w-7 h-7 text-[#ddb049]" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2 text-center">
            One last step!
          </h1>
          <p className="text-sm text-slate-600 mb-6 text-center">
            Share your experience with this course to unlock your certificate.
            Your review helps future students — admins may feature it on the course page.
          </p>

          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 text-center">
              Your Rating
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      n <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Your Experience
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              placeholder="What did you learn? How has this course helped you? (min 30 characters)"
              className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7] text-sm font-medium resize-none leading-relaxed"
            />
            <div className="flex justify-between mt-1.5">
              <span
                className={`text-[10px] font-bold ${
                  reviewText.trim().length >= MIN_CHARS
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                {reviewText.trim().length} / {MIN_CHARS} min
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={submitting || reviewText.trim().length < MIN_CHARS}
            className="w-full mt-4 min-h-[48px] py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-black shadow-[0_8px_20px_rgba(221,176,73,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{submitting ? 'Submitting...' : 'Submit & Unlock Certificate'}</span>
          </button>

          <Link
            href={`/learn/${courseId}`}
            className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#e8e0d2] text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Award className="w-7 h-7 text-[#ddb049]" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Certificate Locked</h1>
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

  return (
    <div className="min-h-screen bg-[#fbfaf7] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
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

        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-[#e8e0d2] shadow-2xl overflow-x-auto flex justify-center">
          <div ref={previewRef} className="shrink-0 shadow-lg rounded-xl overflow-hidden">
            <CertificateTemplate data={certData} templateUrl={certData.templateUrl} />
          </div>
        </div>

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
            <span>{downloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}</span>
          </button>

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