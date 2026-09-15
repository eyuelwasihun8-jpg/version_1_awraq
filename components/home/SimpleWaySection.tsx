import React from 'react';
import { Sparkles } from 'lucide-react';

export const SimpleWaySection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Learn Digital Marketing the <span className="text-[#ddb049]">Simple Way</span>
        </h2>

        <div className="group relative mx-auto max-w-3xl">
          <div className="hidden sm:flex absolute -top-4 -right-4 items-center gap-2 bg-[#9230F0] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl z-20">
            <Sparkles className="w-3.5 h-3.5 text-[#FFCD00]" /> Beginner Friendly
          </div>

          <div className="relative rounded-[28px] border border-[#e8e0d2] bg-white shadow-lg px-6 py-8 sm:px-12 sm:py-10 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
            <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
              Awraq helps you learn digital marketing through{' '}
              <span className="text-[#ddb049] font-bold">
                practical courses, live video sessions, and simple guides
              </span>
              . Build skills that work in the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ddb049] to-[#F86BCF] font-bold">
                real world
              </span>
              , and apply what you learn immediately to your own business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};