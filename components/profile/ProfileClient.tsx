'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Loader2,
  Save,
  Upload,
  Camera,
  Lock,
  CheckCircle2,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { createClient } from '@/lib/supabase-browser';

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
  { value: '45+', label: '45+' },
];

const LIFE_STATUS = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'worker', label: 'Employee', emoji: '💼' },
  { value: 'business_owner', label: 'Business Owner', emoji: '🏢' },
  { value: 'freelancer', label: 'Freelancer', emoji: '💻' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

interface Props {
  initialProfile: any;
  email: string;
}

export const ProfileClient: React.FC<Props> = ({ initialProfile, email }) => {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [gender, setGender] = useState(initialProfile?.gender || '');
  const [ageGroup, setAgeGroup] = useState(initialProfile?.age_group || '');
  const [lifeStatus, setLifeStatus] = useState(initialProfile?.life_status || '');
  const [avatarKey, setAvatarKey] = useState(initialProfile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const hasChanges =
    fullName !== (profile?.full_name || '') ||
    phone !== (profile?.phone || '') ||
    gender !== (profile?.gender || '') ||
    ageGroup !== (profile?.age_group || '') ||
    lifeStatus !== (profile?.life_status || '') ||
    avatarKey !== (profile?.avatar_url || '');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      setAvatarKey(data.fileKey);
      toast.success('Photo uploaded! Click Save to apply.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          gender,
          ageGroup,
          lifeStatus,
          avatarUrl: avatarKey || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }

      setProfile(data.profile);
      toast.success('Profile updated!');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-16 pt-24 sm:pt-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">My Profile</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage your personal information and account
          </p>
        </div>

        {/* Profile Photo Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
          <h2 className="text-base font-black text-slate-900 mb-5">Profile Photo</h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <UserAvatar avatarKey={avatarKey} name={fullName} size="2xl" />
              <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center cursor-pointer shadow-lg transition-all border-2 border-white">
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="text-sm font-black text-slate-900 mb-1">
                {fullName || 'Your Name'}
              </div>
              <div className="text-xs text-slate-500 font-medium mb-3">{email}</div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-2">JPG or PNG, max 5MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
          <h2 className="text-base font-black text-slate-900 mb-5">Personal Information</h2>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
                <span className="text-slate-400 font-normal ml-2">(cannot be changed)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold">
                  +251
                </span>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 rounded-r-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGender(g.value)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                      gender === g.value
                        ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Age Group</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAgeGroup(a.value)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                      ageGroup === a.value
                        ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Life Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Life Status</label>
              <div className="grid grid-cols-2 gap-2">
                {LIFE_STATUS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setLifeStatus(s.value)}
                    className={`py-3 px-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                      lifeStatus === s.value
                        ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] hover:border-b-[1px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            {hasChanges && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900">Security</h2>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs font-bold text-[#07CCFD] hover:underline cursor-pointer"
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Click "Change Password" to update your account password
            </p>
          )}
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-black text-slate-900 mb-1">Sign Out</h2>
          <p className="text-xs text-slate-500 font-medium mb-4">
            You will be signed out of your account
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm font-bold cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};