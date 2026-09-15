'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faq';

export const FAQSection: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20 relative z-10 bg-[#fbfaf7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#e8e0d2] border-b-[4px] border-b-slate-200 overflow-hidden shadow-sm hover:border-b-[#ddb049] hover:-translate-y-0.5 transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 sm:px-6 py-5 sm:py-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#fbfaf7] transition-colors"
                >
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {item.question}
                  </span>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all border border-[#e8e0d2] ${
                      isOpen
                        ? 'bg-[#ddb049] text-[#0a0704] border-[#ddb049] rotate-180'
                        : 'bg-[#fbfaf7] text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 text-slate-600 text-sm sm:text-base font-medium leading-relaxed border-t border-[#f0ebe2]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};