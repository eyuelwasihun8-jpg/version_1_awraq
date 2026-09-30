import React from 'react';
import { BrandLoader } from '@/components/BrandLoader';

export default function Loading() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#fbfaf7]">
      <BrandLoader text="Loading Awraq..." size="lg" />
    </div>
  );
}