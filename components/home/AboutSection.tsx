import React from 'react';
import { User, BookOpen } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-28 relative z-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-center">
          <div className="w-full md:w-5/12">
            <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://res.cloudinary.com/dw1ohipim/image/upload/v1788610521/zdd0btz0dhpdrl3qdekg.jpg"
                alt="Lamlak - Founder of Awraq"
                loading="lazy"
                className="w-full h-[400px] sm:h-[500px] object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 sm:p-8">
                <div className="text-white font-black text-2xl sm:text-3xl mb-1">Lamlak</div>
                <div className="text-[#07CCFD] font-bold text-xs sm:text-sm tracking-wider uppercase">
                  Founder & Educator
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 space-y-5 sm:space-y-6">
            <span className="text-[#07CCFD] font-bold text-xs sm:text-sm tracking-widest uppercase bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full inline-block">
              About Awraq
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Making Digital Marketing Easy to Understand.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Awraq was created to help people learn digital marketing without confusing jargon.
              We believe anyone can master these skills with the right guidance and practical
              examples.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 rounded-full flex items-center justify-center text-[#07CCFD] mb-4">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  3+ Years Experience
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  Teaching marketing and helping businesses grow their online presence.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-full flex items-center justify-center text-[#F86BCF] mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Areas of Expertise
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  Copywriting, Social Media Growth, and step-by-step Marketing Strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};