'use client';

import React from 'react';
import {
  Strategy3DIcon,
  Copywriting3DIcon,
  Social3DIcon,
  SEO3DIcon,
} from '@/components/ThreeDIcons';

const TOPICS = [
  {
    title: 'Marketing Strategy',
    desc: 'Plan your marketing and choose the right approach for your goals.',
    icon: Strategy3DIcon,
  },
  {
    title: 'Copywriting',
    desc: "Write clear messages that get people's attention and drive action.",
    icon: Copywriting3DIcon,
  },
  {
    title: 'Social Media',
    desc: 'Create useful content and grow your presence on social platforms.',
    icon: Social3DIcon,
  },
  {
    title: 'SEO',
    desc: 'Help your website appear higher in Google search results.',
    icon: SEO3DIcon,
  },
];

export const WhatYouLearnSection: React.FC = () => {
  const scrollToCourses = () => {
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28 relative z-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            What You Can Learn
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium max-w-2xl mx-auto">
            Master the core skills needed to build and grow a successful digital presence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {TOPICS.map((topic, idx) => {
            const Icon3D = topic.icon;
            return (
              <div
                key={idx}
                className="relative group cursor-pointer"
                onClick={scrollToCourses}
              >
                <div className="relative bg-white rounded-[20px] p-6 sm:p-8 text-center shadow-md border border-[#e8e0d2] border-b-[6px] border-b-slate-200 group-hover:border-b-[#ddb049] group-hover:-translate-y-1.5 group-hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mb-5 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon3D size={80} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-2 sm:mb-3 group-hover:text-[#ddb049] transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {topic.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};