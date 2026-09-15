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
import { TestimonialsMediaSection } from './TestimonialsMediaSection';
import { FAQSection } from './FAQSection';
import { ContactSection } from './ContactSection';
import { FinalCTASection } from './FinalCTASection';
import type { Course, DigitalProduct } from '@/lib/types';

interface HomePageClientProps {
  courses: Course[];
  products: DigitalProduct[];
  onOpenConsultation?: () => void;
  onOpenSignIn?: () => void;
}

export const HomePageClient: React.FC<HomePageClientProps> = ({
  courses,
  products,
  onOpenConsultation,
  onOpenSignIn,
}) => {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans selection:bg-[#ddb049]/30 overflow-x-hidden relative">
      {/* Gold & Ink ambient gradients */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,_#ddb049_0%,_transparent_60%)] opacity-[0.10] blur-[100px]" />
        <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_#0a0704_0%,_transparent_60%)] opacity-[0.05] blur-[100px]" />
      </div>

      <HeroSection
        onOpenConsultation={onOpenConsultation}
        onOpenSignIn={onOpenSignIn}
      />

      <TrustedBySection />

      <SimpleWaySection />
      <WhatYouLearnSection />
      <SkillsYouUseSection />
      <CoursesSection courses={courses} />
      <ResourcesSection products={products} />
      <AboutSection />
      <TestimonialsMediaSection />
      <FAQSection />
      <ContactSection />
      <FinalCTASection />
    </div>
  );
};