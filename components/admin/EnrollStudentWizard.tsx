'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  BookOpen,
  Package,
  Gift,
  Banknote,
  Megaphone,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  courses: any[];
  products: any[];
  staffRole: string;
}

type Step = 1 | 2 | 3 | 4; // 1: Student, 2: Access & Payment, 3: Review, 4: Done

type SourceType = 'manual' | 'gift' | 'promotion';

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export const EnrollStudentWizard: React.FC<Props> = ({ courses, products }) => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1: Student Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Item & Payment
  const [itemType, setItemType] = useState<'course' | 'digital_product'>('course');
  const [itemId, setItemId] = useState('');
  const [source, setSource] = useState<SourceType>('manual');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Step 3: Submitting
  const [submitting, setSubmitting] = useState(false);

  // Step 4: Success Result
  const [resultData, setResultData] = useState<any>(null);

  const selectedItem =
    itemType === 'course'
      ? courses.find((c) => c.id === itemId)
      : products.find((p) => p.id === itemId);

  // Validation conditions
  const canGoStep2 =
    fullName.trim().length >= 2 &&
    email.trim().includes('@') &&
    password.length >= 6;

  const canGoStep3 =
    !!itemId &&
    (source === 'gift' || source === 'promotion' || transactionNumber.trim().length > 0);

  const handleConfirmEnrollment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          password,
          itemType,
          itemId,
          source,
          transactionNumber: transactionNumber.trim() || null,
          notes: notes.trim() || null,
          createPaymentRecord: true,
          amount: source === 'gift' || source === 'promotion' ? 0 : selectedItem?.price ?? 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      setResultData(data);
      setStep(4); // Go to Done screen
      toast.success('Student enrolled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const copyAllCredentials = () => {
    if (!resultData?.credentials) return;
    const text = `Awraq Account Created\nEmail: ${resultData.credentials.email}\nPassword: ${resultData.credentials.password}\nLogin: ${window.location.origin}/login`;
    copyText(text, 'All credentials');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/${PORTAL_SLUG}/students`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Students Directory</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            Enroll New Student
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Register a student and grant instant course or product access
          </p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s
                    ? 'bg-slate-900 text-white shadow-md'
                    : step > s
                    ? 'bg-[#20B486] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-all ${
                    step > s ? 'bg-[#20B486]' : 'bg-slate-100'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-slate-500 px-1">
          <span className={step >= 1 ? 'text-slate-900' : ''}>Student</span>
          <span className={step >= 2 ? 'text-slate-900' : ''}>Access & Pay</span>
          <span className={step >= 3 ? 'text-slate-900' : ''}>Review</span>
          <span className={step >= 4 ? 'text-slate-900' : ''}>Done</span>
        </div>
      </div>

      {/* ─── STEP 1: STUDENT INFORMATION ─── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">1. Student Details</h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter student information to generate their account
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Kebede"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone (optional)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold">
                  +251
                </span>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 rounded-r-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono tracking-wider"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Account Password *</label>
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="text-[11px] font-bold text-[#07CCFD] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Generate Password
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => canGoStep2 && setStep(2)}
              disabled={!canGoStep2}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              <span>Next: Access & Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: COURSE / PRODUCT & PAYMENT ─── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">2. Assign Access & Payment</h2>
            <p className="text-xs text-slate-500 font-medium">Select what item to enroll for {fullName}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Item Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setItemType('course');
                  setItemId('');
                }}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  itemType === 'course'
                    ? 'border-[#07CCFD] bg-cyan-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <BookOpen className={`w-5 h-5 mb-2 ${itemType === 'course' ? 'text-[#07CCFD]' : 'text-slate-400'}`} />
                <div className="text-sm font-black text-slate-900">Course</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType('digital_product');
                  setItemId('');
                }}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  itemType === 'digital_product'
                    ? 'border-[#07CCFD] bg-cyan-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Package className={`w-5 h-5 mb-2 ${itemType === 'digital_product' ? 'text-[#07CCFD]' : 'text-slate-400'}`} />
                <div className="text-sm font-black text-slate-900">Digital Product</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {itemType === 'course' ? 'Select Course *' : 'Select Product *'}
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-bold bg-white cursor-pointer"
            >
              <option value="">Choose item...</option>
              {(itemType === 'course' ? courses : products).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} — ETB {Number(item.price || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Enrollment Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <SourceBtn
                active={source === 'manual'}
                onClick={() => setSource('manual')}
                icon={Banknote}
                label="Cash / Bank"
                desc="In-person payment"
              />
              <SourceBtn
                active={source === 'gift'}
                onClick={() => setSource('gift')}
                icon={Gift}
                label="Free / Gift"
                desc="No charge"
              />
              <SourceBtn
                active={source === 'promotion'}
                onClick={() => setSource('promotion')}
                icon={Megaphone}
                label="Promotion"
                desc="Scholarship"
              />
            </div>
          </div>

          {source === 'manual' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Transaction / Reference Number *
              </label>
              <input
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="e.g. CBE-TX-123456 or CASH-IN-PERSON"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Paid cash at office, enrolled by sales team..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm resize-none"
            />
          </div>

          <div className="pt-2 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => canGoStep3 && setStep(3)}
              disabled={!canGoStep3}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              <span>Next: Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: REVIEW & CONFIRM ─── */}
      {step === 3 && selectedItem && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">3. Review & Confirm</h2>
            <p className="text-xs text-slate-500 font-medium">Verify details before granting access</p>
          </div>

          {/* Review Details Card */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                Student Account Details
              </div>
              <ReviewRow label="Full Name" value={fullName} />
              <ReviewRow label="Email" value={email} />
              <ReviewRow label="Phone" value={phone || 'None'} />
              <ReviewRow label="Initial Password" value={password} mono />
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100 space-y-3">
              <div className="text-xs font-black text-cyan-900 uppercase tracking-wider border-b border-cyan-200/60 pb-2">
                Enrollment Details
              </div>
              <ReviewRow label="Item Type" value={itemType === 'course' ? 'Course' : 'Digital Product'} />
              <ReviewRow label="Title" value={selectedItem.title} />
              <ReviewRow
                label="Amount"
                value={
                  source === 'gift' || source === 'promotion'
                    ? 'ETB 0 (Free)'
                    : `ETB ${Number(selectedItem.price || 0).toLocaleString()}`
                }
              />
              <ReviewRow label="Enrollment Source" value={source.toUpperCase()} />
              {source === 'manual' && (
                <ReviewRow label="TX Reference" value={transactionNumber || 'N/A'} mono />
              )}
              {notes && <ReviewRow label="Notes" value={notes} />}
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmEnrollment}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[4px] border-[#047857] hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold shadow-[0_8px_20px_rgba(32,180,134,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling Student...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm & Enroll Student</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: DONE & CREDENTIALS ─── */}
      {step === 4 && resultData && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#20B486]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Student Enrolled Successfully! 🎉</h2>
            <p className="text-sm text-slate-500 font-medium">
              <span className="font-bold text-slate-900">{resultData.student.fullName}</span> has been granted access to{' '}
              <span className="font-bold text-slate-900">{resultData.item.title}</span>.
            </p>
          </div>

          {/* Credentials Card */}
          {resultData.credentials && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <div className="text-xs uppercase font-black text-amber-900 tracking-wider mb-2">
                📋 Student Credentials (Share with Student)
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Email</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {resultData.credentials.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(resultData.credentials.email, 'Email')}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Password</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {resultData.credentials.password}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(resultData.credentials.password, 'Password')}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={copyAllCredentials}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Credentials Text
              </button>
            </div>
          )}

          {/* PROMINENT DONE BUTTON */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${PORTAL_SLUG}/students`)}
              className="flex-1 min-h-[50px] py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[4px] border-[#047857] hover:border-b-[2px] hover:translate-y-[2px] text-white text-base font-black shadow-lg transition-all text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Done (Return to Directory)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SourceBtn = ({ active, onClick, icon: Icon, label, desc }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
      active ? 'border-[#07CCFD] bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-[#07CCFD]' : 'text-slate-400'}`} />
    <div className="text-xs font-black text-slate-900">{label}</div>
    <div className="text-[10px] text-slate-500 font-medium">{desc}</div>
  </button>
);

const ReviewRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between gap-2 text-xs">
    <span className="text-slate-500 font-medium">{label}:</span>
    <span className={`font-bold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);