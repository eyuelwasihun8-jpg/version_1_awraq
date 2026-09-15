'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  UserPlus,
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
  Eye,
  EyeOff,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

interface Props {
  courses: any[];
  products: any[];
  staffRole: string;
}

type Step = 1 | 2 | 3;

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

  // Step 1 state
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Create new student fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Step 2 state
  const [itemType, setItemType] = useState<'course' | 'digital_product'>('course');
  const [itemId, setItemId] = useState('');
  const [source, setSource] = useState<SourceType>('manual');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [createPaymentRecord, setCreatePaymentRecord] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Step 3 success
  const [successData, setSuccessData] = useState<any>(null);

  // Search students (debounced)
  useEffect(() => {
    if (mode !== 'search') return;
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          search: search.trim(),
          page: '1',
          limit: '8',
          sort: 'newest',
        });
        const res = await fetch(`/api/admin/students?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        setSearchResults(data.students || []);
      } catch (err: any) {
        toast.error(err.message || 'Search failed');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [search, mode]);

  const selectedItem =
    itemType === 'course'
      ? courses.find((c) => c.id === itemId)
      : products.find((p) => p.id === itemId);

  const canGoStep2 =
    !!selectedStudent ||
    (mode === 'create' &&
      fullName.trim().length >= 2 &&
      email.trim().includes('@') &&
      password.length >= 6);

  const canEnroll =
    !!selectedStudent &&
    !!itemId &&
    (source === 'gift' || source === 'promotion' || transactionNumber.trim().length > 0);

  // Create student if needed, then go to step 2
  const handleContinueToStep2 = async () => {
    if (selectedStudent) {
      setStep(2);
      return;
    }

    // Create new student first
    if (mode !== 'create') return;

    setCreatingStudent(true);
    try {
      const res = await fetch('/api/admin/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student');

      setSelectedStudent({
        id: data.student.id,
        fullName: data.student.fullName,
        email: data.student.email,
        phone: data.student.phone,
        avatarUrl: null,
      });

      setCreatedCredentials({
        email: data.credentials.email,
        password: data.credentials.password,
      });

      toast.success('Student account created');
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Could not create student');
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !itemId) return;

    if (source === 'manual' && !transactionNumber.trim()) {
      toast.error('Transaction / reference number is required for cash/bank enrollments');
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch('/api/admin/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          itemType,
          itemId,
          source,
          transactionNumber: transactionNumber.trim() || null,
          notes: notes.trim() || null,
          createPaymentRecord,
          amount:
            source === 'gift' || source === 'promotion'
              ? 0
              : selectedItem?.price ?? 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      setSuccessData({
        student: selectedStudent,
        item: selectedItem,
        itemType,
        source,
        credentials: createdCredentials,
        message: data.message,
      });
      setStep(3);
      toast.success('Student enrolled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials && !successData?.credentials) return;
    const creds = successData?.credentials || createdCredentials;
    const text = `Awraq Login Credentials\nEmail: ${creds.email}\nPassword: ${creds.password}\nLogin: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    copyText(text, 'Credentials');
  };

  const resetWizard = () => {
    setStep(1);
    setMode('search');
    setSearch('');
    setSearchResults([]);
    setSelectedStudent(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword(generatePassword());
    setCreatedCredentials(null);
    setItemType('course');
    setItemId('');
    setSource('manual');
    setTransactionNumber('');
    setNotes('');
    setCreatePaymentRecord(true);
    setSuccessData(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/${PORTAL_SLUG}/students`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Students
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            Enroll Student
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Register a student and grant course or product access instantly
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                  step === s
                    ? 'bg-slate-900 text-white'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded-full ${
                    step > s ? 'bg-emerald-400' : 'bg-slate-100'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-slate-500">
          <span>Student</span>
          <span>Access</span>
          <span>Done</span>
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">1. Choose Student</h2>
            <p className="text-xs text-slate-500 font-medium">
              Search an existing student or create a new account
            </p>
          </div>

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('search');
                setSelectedStudent(null);
              }}
              className={`py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                mode === 'search'
                  ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1.5" />
              Existing Student
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setSelectedStudent(null);
              }}
              className={`py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                mode === 'create'
                  ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" />
              Create New
            </button>
          </div>

          {/* SEARCH MODE */}
          {mode === 'search' && (
            <div className="space-y-4">
              {selectedStudent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <UserAvatar
                    avatarKey={selectedStudent.avatarUrl}
                    name={selectedStudent.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">
                      {selectedStudent.fullName}
                    </div>
                    <div className="text-xs text-slate-600 font-medium truncate">
                      {selectedStudent.email || selectedStudent.phone || 'Selected'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-lg hover:bg-white text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, phone, or email..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none text-sm"
                    />
                  </div>

                  {searching && (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  )}

                  {!searching && search.trim() && searchResults.length === 0 && (
                    <div className="py-6 text-center text-sm text-slate-500 font-medium">
                      No students found. Try creating a new account.
                    </div>
                  )}

                  <div className="space-y-2">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudent(s)}
                        className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#07CCFD] hover:bg-cyan-50/40 text-left cursor-pointer transition-all flex items-center gap-3"
                      >
                        <UserAvatar avatarKey={s.avatarUrl} name={s.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-slate-900 truncate">
                            {s.fullName || 'Unnamed'}
                          </div>
                          <div className="text-xs text-slate-500 font-medium truncate">
                            {s.phone || s.email}
                            {s.coursesCount > 0 ? ` · ${s.coursesCount} course(s)` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* CREATE MODE */}
          {mode === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Kebede"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone (optional)
                </label>
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
                      className="w-full pl-10 pr-4 py-3 rounded-r-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Temporary Password *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Generate new password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Share this password with the student. They can change it later in Profile.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleContinueToStep2}
              disabled={!canGoStep2 || creatingStudent}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              {creatingStudent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && selectedStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">2. Grant Access</h2>
            <p className="text-xs text-slate-500 font-medium">
              Assign a course or digital product to this student
            </p>
          </div>

          {/* Selected student chip */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <UserAvatar
              avatarKey={selectedStudent.avatarUrl}
              name={selectedStudent.fullName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-slate-900 truncate">
                {selectedStudent.fullName}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate">
                {selectedStudent.email || selectedStudent.phone}
              </div>
            </div>
            {createdCredentials && (
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                New Account
              </span>
            )}
          </div>

          {/* Item type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">What to enroll?</label>
            <div className="grid grid-cols-2 gap-2">
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
                <BookOpen
                  className={`w-5 h-5 mb-2 ${
                    itemType === 'course' ? 'text-[#07CCFD]' : 'text-slate-400'
                  }`}
                />
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
                <Package
                  className={`w-5 h-5 mb-2 ${
                    itemType === 'digital_product' ? 'text-[#07CCFD]' : 'text-slate-400'
                  }`}
                />
                <div className="text-sm font-black text-slate-900">Digital Product</div>
              </button>
            </div>
          </div>

          {/* Item select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {itemType === 'course' ? 'Select Course *' : 'Select Product *'}
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-bold bg-white cursor-pointer"
            >
              <option value="">Choose one...</option>
              {(itemType === 'course' ? courses : products).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} — ETB {Number(item.price || 0).toLocaleString()}
                  {item.is_published === false ? ' (Draft)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Enrollment Type *
            </label>
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
                desc="No payment"
              />
              <SourceBtn
                active={source === 'promotion'}
                onClick={() => setSource('promotion')}
                icon={Megaphone}
                label="Promotion"
                desc="Scholarship / promo"
              />
            </div>
          </div>

          {/* Transaction number */}
          {(source === 'manual') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Transaction / Reference Number *
              </label>
              <input
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="e.g. CBE-TX-123456 or CASH-2025-001"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm font-mono"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Internal Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Paid cash at office, referred by sales team..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none text-sm resize-none"
            />
          </div>

          {/* Payment record toggle */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={createPaymentRecord}
              onChange={(e) => setCreatePaymentRecord(e.target.checked)}
              className="mt-1 accent-[#07CCFD]"
            />
            <div>
              <div className="text-sm font-bold text-slate-900">
                Create payment record for bookkeeping
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Recommended for cash/bank enrollments so revenue reports stay accurate
              </div>
            </div>
          </label>

          {/* Summary */}
          {selectedItem && (
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100">
              <div className="text-[10px] uppercase font-black text-cyan-700 tracking-wider mb-1">
                Summary
              </div>
              <div className="text-sm font-black text-slate-900">{selectedItem.title}</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {selectedStudent.fullName} ·{' '}
                {source === 'gift' || source === 'promotion'
                  ? 'ETB 0 (Free)'
                  : `ETB ${Number(selectedItem.price || 0).toLocaleString()}`}{' '}
                · {source}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={enrolling}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleEnroll}
              disabled={!canEnroll || enrolling}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[3px] border-[#047857] text-white text-sm font-bold cursor-pointer disabled:opacity-50 shadow-lg transition-all"
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll Student</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 SUCCESS */}
      {step === 3 && successData && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#20B486]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Student Enrolled!</h2>
            <p className="text-sm text-slate-500 font-medium">
              {successData.student.fullName} now has access to{' '}
              <span className="font-bold text-slate-800">{successData.item?.title}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
            <Row label="Student" value={successData.student.fullName} />
            <Row
              label="Item"
              value={`${successData.itemType === 'course' ? 'Course' : 'Product'}: ${successData.item?.title}`}
            />
            <Row label="Type" value={successData.source} />
          </div>

          {/* Credentials box (only if newly created) */}
          {successData.credentials && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <div className="text-[10px] uppercase font-black text-amber-800 tracking-wider mb-2">
                📋 Login Credentials (copy & share)
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Email</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {successData.credentials.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(successData.credentials.email, 'Email')}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Password</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {successData.credentials.password}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(successData.credentials.password, 'Password')}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={copyCredentials}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All Credentials
              </button>
              <p className="text-[11px] text-amber-800 font-medium mt-3 text-center">
                Share via WhatsApp or write it down. Password is shown only once.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              href={`/${PORTAL_SLUG}/students/${successData.student.id}`}
              className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold text-center cursor-pointer"
            >
              View Student Profile
            </Link>
            <button
              type="button"
              onClick={resetWizard}
              className="py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] text-[#0F172A] text-sm font-bold cursor-pointer"
            >
              Enroll Another Student
            </button>
          </div>

          <div className="text-center">
            <Link
              href={`/${PORTAL_SLUG}/students`}
              className="text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              ← Back to Students Directory
            </Link>
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
      active
        ? 'border-[#07CCFD] bg-cyan-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-[#07CCFD]' : 'text-slate-400'}`} />
    <div className="text-xs font-black text-slate-900">{label}</div>
    <div className="text-[10px] text-slate-500 font-medium">{desc}</div>
  </button>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="font-bold text-slate-900 text-right capitalize">{value}</span>
  </div>
);