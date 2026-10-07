'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ArrowUpRight, FileText } from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import type { DigitalProduct } from '@/lib/types';

interface Props {
  products: DigitalProduct[];
}

export const ResourcesSection: React.FC<Props> = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section id="resources" className="py-16 sm:py-24 bg-[#fbfaf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-xs sm:text-sm font-black text-[#ddb049] uppercase tracking-widest mb-2">
            Instant Downloads
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3">
            Digital Products &amp; Resources
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Get access to guides, templates, and digital assets to accelerate your marketing workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-xl overflow-hidden transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {product.thumbnail_url ? (
                  <CourseThumbnail
                    thumbnailKey={product.thumbnail_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-slate-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-slate-100">
                    <Package className="w-12 h-12 text-[#ddb049]" />
                  </div>
                )}

                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-slate-700 border border-[#e8e0d2] inline-flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#ddb049]" />
                  {product.file_type || 'Digital'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2 group-hover:text-[#ddb049] transition-colors">
                  {product.title}
                </h3>
                {product.short_description && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 min-h-[32px]">
                    {product.short_description}
                  </p>
                )}
                <div className="mt-auto pt-4 border-t border-[#f0ebe2] flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    {Number(product.price || 0) === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      <>ETB {Number(product.price || 0).toLocaleString()}</>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ddb049] group-hover:gap-2 transition-all">
                    View <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};