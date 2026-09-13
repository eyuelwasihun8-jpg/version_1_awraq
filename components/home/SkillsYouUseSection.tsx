'use client';

import React, { useState, useEffect } from 'react';
import { Target, Zap, LineChart, Rocket, ChevronRight } from 'lucide-react';

const SKILLS = [
  {
    id: 'basics',
    number: '01',
    title: 'Learn the Basics',
    desc: 'Understand the most important ideas before moving to advanced topics. We build your foundation the right way — no confusing jargon, no random hacks.',
    icon: Target,
    gradient: 'from-[#07CCFD] to-[#3080E0]',
    visualIcon: '🎯',
  },
  {
    id: 'practice',
    number: '02',
    title: 'Practice What You Learn',
    desc: 'Use what you learn immediately instead of just reading or watching. Every lesson comes with real exercises you can apply to your own business today.',
    icon: Zap,
    gradient: 'from-[#9230F0] to-[#7C11FB]',
    visualIcon: '⚡',
  },
  {
    id: 'examples',
    number: '03',
    title: 'Learn From Real Examples',
    desc: 'See exactly how digital marketing ideas are used by successful businesses. No theory-only lessons — everything is backed by real-world case studies.',
    icon: LineChart,
    gradient: 'from-[#F86BCF] to-[#7C11FB]',
    visualIcon: '📊',
  },
  {
    id: 'improve',
    number: '04',
    title: 'Keep Improving',
    desc: 'Build your skills over time and learn how to read your own results. Get comfortable measuring what works so you can double down on winning strategies.',
    icon: Rocket,
    gradient: 'from-[#FFCD00] to-[#F86BCF]',
    visualIcon: '🚀',
  },
];

export const SkillsYouUseSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SKILLS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeSkill = SKILLS[activeIndex];
  const ActiveIcon = activeSkill.icon;

  return (
    <section className="py-16 sm:py-20 lg:py-28 relative z-10 overflow-hidden bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <span className="inline-block text-[#07CCFD] font-black text-xs sm:text-sm tracking-widest uppercase bg-[#07CCFD]/10 border border-[#07CCFD]/30 px-4 py-1.5 rounded-full">
            Our Approach
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Learn Skills You Can{' '}
            <span className="bg-gradient-to-r from-[#07CCFD] to-[#F86BCF] bg-clip-text text-transparent">
              Actually Use
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium max-w-2xl mx-auto">
            We focus on practical skills you can apply right away — no fluff, no filler.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* LEFT — Steps List */}
          <div className="lg:col-span-2 space-y-3">
            {SKILLS.map((skill, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left cursor-pointer transition-all duration-500 ${
                    isActive ? 'scale-100' : 'scale-95 opacity-70 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <div
                    className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all duration-500 ${
                      isActive
                        ? 'bg-white border-[#07CCFD]/40 shadow-[0_10px_30px_rgba(7,204,253,0.15)]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isActive
                            ? `bg-gradient-to-br ${skill.gradient} shadow-lg`
                            : 'bg-slate-100'
                        }`}
                      >
                        <span
                          className={`font-black text-base sm:text-lg ${
                            isActive ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {skill.number}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-base sm:text-lg font-black leading-tight transition-colors ${
                            isActive ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {skill.title}
                        </h3>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 shrink-0 transition-all duration-500 ${
                          isActive
                            ? 'text-[#07CCFD] translate-x-0'
                            : 'text-slate-300 -translate-x-2'
                        }`}
                      />
                    </div>

                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${skill.gradient}`}
                          style={{ animation: 'progressBar 5s linear' }}
                        ></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT — Active Visual */}
          <div className="lg:col-span-3 relative">
            <div
              key={activeSkill.id}
              className="relative bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200 p-6 sm:p-10 lg:p-12 min-h-[350px] sm:min-h-[420px] shadow-xl overflow-hidden animate-fadeIn"
            >
              <div
                className={`absolute -top-20 -right-20 w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br ${activeSkill.gradient} rounded-full blur-[100px] opacity-25`}
              ></div>

              <div className="relative z-10 mb-6 sm:mb-8">
                <div className="inline-block text-7xl sm:text-8xl lg:text-9xl animate-floatY drop-shadow-xl">
                  {activeSkill.visualIcon}
                </div>
              </div>

              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${activeSkill.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <ActiveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-slate-400 font-black text-xs sm:text-sm tracking-widest uppercase">
                    Step {activeSkill.number}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                  {activeSkill.title}
                </h3>

                <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                  {activeSkill.desc}
                </p>
              </div>

              <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex gap-1.5">
                {SKILLS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      idx === activeIndex ? 'bg-[#07CCFD] w-8' : 'bg-slate-300 w-2'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};