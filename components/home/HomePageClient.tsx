'use client';

import React from 'react';
import { HeroSection } from './HeroSection';
import { SimpleWaySection } from './SimpleWaySection';
import { WhatYouLearnSection } from './WhatYouLearnSection';
import { SkillsYouUseSection } from './SkillsYouUseSection';
import { CoursesSection } from './CoursesSection';
import { ResourcesSection } from './ResourcesSection';
import { AboutSection } from './AboutSection';
import { TrustedBySection } from './TrustedBySection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { ContactSection } from './ContactSection';
import { FinalCTASection } from './FinalCTASection';
import type { Course, DigitalProduct } from '@/lib/types';

interface HomePageClientProps {
  courses: Course[];
  products: DigitalProduct[];
}

export const HomePageClient: React.FC<HomePageClientProps> = ({ courses, products }) => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#07CCFD]/30 overflow-x-hidden relative">
      {/* Soft ambient gradients (very subtle on white) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,_#07CCFD_0%,_transparent_60%)] opacity-[0.08] blur-[100px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_#20B486_0%,_transparent_60%)] opacity-[0.06] blur-[100px]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_#F86BCF_0%,_transparent_60%)] opacity-[0.05] blur-[100px]"></div>
      </div>

      <HeroSection />
      <SimpleWaySection />
      <WhatYouLearnSection />
      <SkillsYouUseSection />
      <CoursesSection courses={courses} />
      <ResourcesSection products={products} />
      <AboutSection />
      <TrustedBySection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <FinalCTASection />
    </div>
  );
};