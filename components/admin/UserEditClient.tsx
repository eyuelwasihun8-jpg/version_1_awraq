'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, User, Phone, Mail, Calendar, Shield, Power } from 'lucide-react';
import { toast } from 'sonner';
const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const ROLES = ['student', 'instructor', 'sales', 'admin', 'super_admin'];

interface Props {
  user: any;
  currentRole: string;
}

export const UserEditClient: React.FC<Props> = ({ user, currentRole }) => {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = currentRole === 'super_admin';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update');
        return;
      }
      toast.success('User updated');
      router.push(`/${PORTAL_SLUG}/users`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
         href={`/${PORTAL_SLUG}/users`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Users</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{user.full_name || 'Unnamed User'}</h1>
        <p className="text-sm text-slate-500 font-medium">Manage user permissions and access</p>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-black text-slate-900 mb-3">Profile Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Full Name" value={user.full_name} />
          <InfoRow icon={Phone} label="Phone" value={user.phone} />
          <InfoRow icon={Mail} label="Gender" value={user.gender} />
          <InfoRow icon={Calendar} label="Age Group" value={user.age_group} />
          <InfoRow icon={User} label="Life Status" value={user.life_status?.replace('_', ' ')} />
          <InfoRow icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 space-y-5">
        <div>
          <h2 className="text-sm font-black text-slate-900 mb-1">Permissions</h2>
          <p className="text-xs text-slate-500 font-medium">
            {isSuperAdmin
              ? 'Change role and active status'
              : 'Only Super Admin can modify roles'}
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Role</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => isSuperAdmin && setRole(r)}
                disabled={!isSuperAdmin}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                  role === r
                    ? 'border-[#ddb049] bg-amber-50 text-[#ddb049]'
                    : 'border-[#e8e0d2] bg-white text-slate-600 hover:border-slate-300'
                } ${!isSuperAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Active toggle */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Power className="w-3.5 h-3.5" />
            <span>Account Status</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => isSuperAdmin && setIsActive(true)}
              disabled={!isSuperAdmin}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-[#e8e0d2] bg-white text-slate-500 hover:border-slate-300'
              } ${!isSuperAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              ✓ Active
            </button>
            <button
              onClick={() => isSuperAdmin && setIsActive(false)}
              disabled={!isSuperAdmin}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                !isActive
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-[#e8e0d2] bg-white text-slate-500 hover:border-slate-300'
              } ${!isSuperAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              ✕ Inactive
            </button>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-bold text-slate-900">{value || '—'}</div>
    </div>
  );
}