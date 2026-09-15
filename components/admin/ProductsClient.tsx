'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Loader2, ChevronRight, Eye, EyeOff, Package } from 'lucide-react';
import { toast } from 'sonner';
import { CourseThumbnail } from './CourseThumbnail';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

export const ProductsClient: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to load products');
          return;
        }
        setProducts(data.products || []);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Digital Products</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage PDFs, templates, and downloadable files
          </p>
        </div>
        <Link
          href={`/${PORTAL_SLUG}/products/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-4">No products yet</p>
            <Link
              href={`/${PORTAL_SLUG}/products/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/${PORTAL_SLUG}/products/${p.id}`}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#fbfaf7] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CourseThumbnail
                    thumbnailKey={p.thumbnail_url}
                    alt={p.title}
                    fallbackClassName="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-black text-slate-900 truncate">{p.title}</span>
                      {p.is_published ? (
                        <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" />
                          Published
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-[#e8e0d2] flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" />
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      ETB {Number(p.price || 0).toLocaleString()} · {p.file_type?.toUpperCase() || 'FILE'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};