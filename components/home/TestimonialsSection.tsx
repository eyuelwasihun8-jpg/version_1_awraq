import React from 'react';
import { Star } from 'lucide-react';
import { TESTIMONIALS } from '@/data/testimonials';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 relative z-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            What Learners Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {TESTIMONIALS.slice(0, 4).map((review) => (
            <div key={review.id} className="relative group">
              <div className="relative bg-white rounded-[24px] sm:rounded-[2rem] p-6 sm:p-8 shadow-md border border-slate-200 border-b-[6px] border-b-slate-200 group-hover:border-b-[#07CCFD] group-hover:shadow-xl transition-all hover:-translate-y-1.5 flex flex-col h-full">
                <div className="flex items-center gap-1 mb-5 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-[#FFCD00] text-[#FFCD00]" />
                  ))}
                </div>
                <p className="text-slate-700 font-medium text-base sm:text-lg italic mb-6 sm:mb-8 flex-1 leading-relaxed">
                  "{review.quote}"
                </p>
                <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.author}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">
                      {review.author}
                    </div>
                    <div className="text-xs font-bold text-[#07CCFD] mt-0.5">{review.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};