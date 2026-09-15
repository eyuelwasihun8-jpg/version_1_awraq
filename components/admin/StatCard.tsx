import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: 'cyan' | 'emerald' | 'blue' | 'amber' | 'purple' | 'pink';
  subtitle?: string;
}

const COLOR_MAP = {
  cyan: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-[#ddb049]' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-[#20B486]' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-[#3B82F6]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-[#F59E0B]' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-[#9230F0]' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-[#F86BCF]' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, subtitle }) => {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d2] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">{value}</div>
      <div className="text-[11px] sm:text-xs font-bold text-slate-600">{label}</div>
      {subtitle && <div className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</div>}
    </div>
  );
};