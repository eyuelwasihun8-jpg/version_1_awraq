'use client';

import React from 'react';
import { Target, Users, Award, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="text-xs sm:text-sm font-black text-[#ddb049] uppercase tracking-widest">
              About Awraq Skills
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              Practical Education for Real-World Growth
            </h2>
            <p className="text-base text-slate-600 font-medium leading-relaxed">
              Awraq Skills was founded to bridge the gap between theoretical marketing concepts and real business results. We provide actionable, step-by-step training tailored for freelancers, entrepreneurs, and ambitious professionals.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Step-by-step video courses with real campaign walkthroughs',
                'Practical exercises you can execute on your business immediately',
                'Active community support and mentorship',
                'Verifiable certificates upon 100% completion',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox icon={Users} title="1,000+" label="Active Students" color="amber" />
            <StatBox icon={Target} title="95%" label="Completion Satisfaction" color="emerald" />
            <StatBox icon={Award} title="100%" label="Verified Certificates" color="purple" />
            <StatBox icon={Users} title="24/7" label="Community Access" color="blue" />
          </div>
        </div>
      </div>
    </section>
  );
};

const StatBox = ({ icon: Icon, title, label, color }: any) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-[#ddb049] border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="bg-[#fbfaf7] rounded-3xl border border-[#e8e0d2] p-6 text-center">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{title}</div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
};