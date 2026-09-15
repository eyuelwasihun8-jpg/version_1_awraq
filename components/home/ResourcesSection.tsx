'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { DigitalProduct } from '@/lib/types';

interface ResourcesSectionProps {
  products: DigitalProduct[];
}

export const ResourcesSection: React.FC<ResourcesSectionProps> = ({ products }) => {
  const displayProducts = products || [];

  return (
    <section id="resources" className="py-16 sm:py-20 lg:py-28 relative z-10 bg-[#fbfaf7]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Digital Resources
          </h2>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto text-sm sm:text-base">
            Download helpful templates, guides, and tools to save time.
          </p>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-16 border border-[#e8e0d2] rounded-[24px] border-dashed bg-white">
            <p className="text-slate-500 font-medium">Digital resources coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {displayProducts.map((resource) => (
              <Link
                key={resource.id}
                href={`/products/${resource.id}`}
                className="bg-white rounded-2xl shadow-md border border-[#e8e0d2] hover:border-slate-300 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer overflow-hidden group"
              >
                <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={
                      resource.thumbnail_url ||
                      'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={resource.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#ddb049] text-[10px] font-black px-2.5 py-1 rounded shadow-sm border border-amber-100 uppercase tracking-wide">
                    {resource.category}
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg mb-2 leading-tight group-hover:text-[#ddb049] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-3">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#f0ebe2] mt-auto">
                    <span className="font-black text-base sm:text-lg text-[#F86BCF]">
                      ETB {resource.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-[#0a0704] bg-[#ddb049] hover:bg-[#c99a3a] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};