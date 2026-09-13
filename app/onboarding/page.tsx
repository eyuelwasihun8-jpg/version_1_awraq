'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { BrandLogo } from '@/components/BrandLogo';
import { toast } from 'sonner';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const AGE_GROUPS = [
  { value: '13-17', label: '13 – 17' },
  { value: '18-24', label: '18 – 24' },
  { value: '25-34', label: '25 – 34' },
  { value: '35-44', label: '35 – 44' },
  { value: '45+', label: '45 and above' },
];

const LIFE_STATUS = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'worker', label: 'Employee', emoji: '💼' },
  { value: 'business_owner', label: 'Business Owner', emoji: '🏢' },
  { value: 'freelancer', label: 'Freelancer', emoji: '💻' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: '',
    ageGroup: '',
    lifeStatus: '',
  });

  // Verify user is authenticated + not already onboarded
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if already onboarded
      try {
        const res = await fetch('/api/onboarding');
        const data = await res.json();
        if (data.profile?.onboarding_completed) {
          router.push('/dashboard');
          return;
        }
        // Pre-fill name if available
        if (data.profile?.full_name) {
          setFormData((prev) => ({ ...prev, fullName: data.profile.full_name }));
        }
      } catch {
        // continue anyway
      }
      setCheckingAuth(false);
    };
    check();
  }, [router]);

  const canProceedStep1 = formData.fullName.trim().length >= 2 && formData.phone.trim().length >= 9;
  const canProceedStep2 = formData.gender && formData.ageGroup;
  const canSubmit = formData.lifeStatus;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to complete onboarding');
        setLoading(false);
        return;
      }

      toast.success('Welcome to Awraq! 🎉');
      router.push('/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#07CCFD]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex flex-col">
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <div className="text-xs sm:text-sm text-slate-500 font-bold">
          Step {step} of 3
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-6 sm:mb-8">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#07CCFD] to-[#20B486] rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 lg:p-10">
            {/* ─── STEP 1: Name + Phone ─── */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-[#07CCFD]" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                    Let's get to know you
                  </h1>
                  <p className="text-sm text-slate-500">
                    We'll personalize your learning experience
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Sarah Kebede"
                        className="w-full pl-10 pr-4 py-3.5 text-base rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <div className="flex shadow-sm">
                      <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold">
                        +251
                      </span>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="9XX XXX XXX"
                          className="w-full pl-10 pr-4 py-3.5 text-base rounded-r-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none transition-all bg-slate-50/50 font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => canProceedStep1 && setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ─── STEP 2: Gender + Age ─── */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                    A bit more about you
                  </h1>
                  <p className="text-sm text-slate-500">
                    Help us understand our community better
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setFormData({ ...formData, gender: g.value })}
                          className={`py-3 sm:py-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                            formData.gender === g.value
                              ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Age Group *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                      {AGE_GROUPS.map((a) => (
                        <button
                          key={a.value}
                          onClick={() => setFormData({ ...formData, ageGroup: a.value })}
                          className={`py-3 sm:py-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                            formData.ageGroup === a.value
                              ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="sm:flex-1 min-h-[48px] py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => canProceedStep2 && setStep(3)}
                    disabled={!canProceedStep2}
                    className="sm:flex-1 min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Life Status ─── */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                    What best describes you?
                  </h1>
                  <p className="text-sm text-slate-500">
                    We'll recommend courses based on your goals
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LIFE_STATUS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFormData({ ...formData, lifeStatus: s.value })}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                        formData.lifeStatus === s.value
                          ? 'border-[#07CCFD] bg-cyan-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <div className="flex-1">
                        <div
                          className={`text-sm sm:text-base font-black ${
                            formData.lifeStatus === s.value ? 'text-[#07CCFD]' : 'text-slate-800'
                          }`}
                        >
                          {s.label}
                        </div>
                      </div>
                      {formData.lifeStatus === s.value && (
                        <CheckCircle2 className="w-5 h-5 text-[#07CCFD] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="sm:flex-1 min-h-[48px] py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer disabled:opacity-70"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="sm:flex-1 min-h-[48px] py-3.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[4px] border-[#047857] hover:border-b-[2px] hover:translate-y-[2px] text-white text-sm font-bold shadow-[0_8px_20px_rgba(32,180,134,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Setup</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}