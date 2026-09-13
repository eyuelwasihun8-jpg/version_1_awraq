'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

const ROLES = [
  { value: 'sales', label: 'Sales', description: 'Approve/reject payments', color: 'emerald' },
  { value: 'instructor', label: 'Instructor', description: 'Create and manage courses', color: 'amber' },
  { value: 'admin', label: 'Admin', description: 'Full management (except role changes)', color: 'blue' },
];

export const NewStaffClient: React.FC = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState<any | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pw);
    setShowPassword(true);
    toast.success('Password generated');
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !password || password.length < 8) {
      toast.error('Fill all required fields (password min 8 chars)');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create staff');
        return;
      }

      setCreatedUser({ ...data.user, password });
      toast.success('Staff account created!');
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    const text = `Staff Account Created
━━━━━━━━━━━━━━━━━━━━
Name: ${createdUser.full_name}
Email: ${createdUser.email}
Password: ${createdUser.password}
Role: ${createdUser.role}
Login URL: ${window.location.origin}/staff-login-x7k9m

⚠️ Save this password securely. It cannot be retrieved.`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  // Success screen
  if (createdUser) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#20B486]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Staff Account Created!</h1>
            <p className="text-sm text-slate-500 font-medium">
              Share these credentials securely with the staff member
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 space-y-3 mb-4">
            <CredentialRow label="Name" value={createdUser.full_name} />
            <CredentialRow label="Email" value={createdUser.email} />
            <CredentialRow label="Password" value={createdUser.password} mono />
            <CredentialRow label="Role" value={createdUser.role} />
            <CredentialRow label="Login URL" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/staff-login-x7k9m`} />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-800 font-bold">
              ⚠️ This password cannot be retrieved later. Copy it now and send it to the staff member securely (encrypted message, in-person, etc).
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyCredentials}
              className="flex-1 py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] text-[#0F172A] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Copy All</span>
            </button>
            <button
              onClick={() => router.push(`/${SLUG}/users`)}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/${SLUG}/users`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Users</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Add Staff Member</h1>
        <p className="text-sm text-slate-500 font-medium">
          Create a new admin, sales, or instructor account
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Kebede"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@awraq.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone (optional)</label>
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">Password * (min 8 chars)</label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-[11px] font-bold text-[#07CCFD] hover:underline cursor-pointer"
            >
              Generate secure
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Role *</span>
          </label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  role === r.value
                    ? 'border-[#07CCFD] bg-cyan-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-black ${role === r.value ? 'text-[#07CCFD]' : 'text-slate-900'}`}>
                    {r.label}
                  </span>
                  {role === r.value && <CheckCircle2 className="w-4 h-4 text-[#07CCFD]" />}
                </div>
                <p className="text-xs text-slate-500 font-medium">{r.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800 font-medium">
            <strong className="font-bold">Note:</strong> Super Admin role can only be granted by editing the database directly. This is for security — there should only be one super admin.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={creating}
          className="w-full min-h-[48px] py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          <span>{creating ? 'Creating...' : 'Create Staff Account'}</span>
        </button>
      </div>
    </div>
  );
};

function CredentialRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-bold text-white break-all ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}