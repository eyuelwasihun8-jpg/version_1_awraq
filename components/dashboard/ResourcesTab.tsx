'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Loader2, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  enrolledProducts: any[];
  allPayments: any[];
}

export const ResourcesTab: React.FC<Props> = ({ enrolledProducts }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (productId: string) => {
    setDownloadingId(productId);
    try {
      const res = await fetch(`/api/download?productId=${productId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to get download link');
        return;
      }
      window.open(data.url, '_blank');
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (enrolledProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">No downloads yet</h3>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
          Browse our digital products — PDFs, templates, guides & more
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[3px] border-[#05A3CA] text-[#0F172A] text-sm font-bold cursor-pointer transition-all"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">Your Downloads</h2>
        <span className="text-xs text-slate-500 font-medium">
          {enrolledProducts.length} product{enrolledProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {enrolledProducts.map((product) => {
          const isDownloading = downloadingId === product.id;
          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md overflow-hidden transition-all flex flex-col"
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-slate-700 border border-slate-200">
                  {product.file_type || 'File'}
                </div>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2">
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3">
                    {product.description}
                  </p>
                )}

                <button
                  onClick={() => handleDownload(product.id)}
                  disabled={isDownloading}
                  className="mt-auto w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-b from-[#20B486] to-[#059669] border-b-[3px] border-[#047857] hover:border-b-[1px] hover:translate-y-[1px] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(32,180,134,0.3)]"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting link...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};