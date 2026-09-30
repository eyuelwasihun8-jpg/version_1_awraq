'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { useModals } from '@/components/RootLayoutClient';

interface Props {
  product: any;
  isLoggedIn: boolean;
  alreadyOwned: boolean;
  pendingPaymentId: string | null;
}

export function ProductDetailClient({
  product,
  isLoggedIn,
  alreadyOwned,
  pendingPaymentId,
}: Props) {
  const router = useRouter();
  const { openSignIn } = useModals();

  const price = Number(product.price || 0);
  const includes: string[] = Array.isArray(product.includes)
    ? product.includes
    : typeof product.includes === 'string'
      ? [product.includes]
      : [];

  const handleBuy = () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }
    if (alreadyOwned) {
      router.push('/dashboard');
      return;
    }
    if (pendingPaymentId) {
      router.push(`/purchase/waiting/${pendingPaymentId}`);
      return;
    }
    router.push(`/purchase/item/digital_product/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/#resources"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-[#e8e0d2] shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 relative">
                {product.thumbnail_url ? (
                  <CourseThumbnail
                    thumbnailKey={product.thumbnail_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-slate-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
                    <Package className="w-16 h-16 text-[#ddb049]" />
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-[#f0ebe2]">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                  Digital Product
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-[#ddb049]" />
                  <span className="uppercase">{product.file_type || 'file'}</span>
                  {product.file_size_bytes ? (
                    <span className="text-slate-400 font-medium">
                      · {(Number(product.file_size_bytes) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-3xl border border-[#e8e0d2] shadow-sm p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                {product.title}
              </h1>

              {product.short_description || product.description ? (
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-line">
                  {product.short_description || product.description}
                </p>
              ) : null}

              {includes.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                    What&apos;s included
                  </div>
                  <ul className="space-y-2">
                    {includes.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price + CTA area */}
              <div className="pt-4 border-t border-[#f0ebe2]">
                {!isLoggedIn ? (
                  /* Anonymous: locked price */
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50 border-2 border-amber-200 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#ddb049] flex items-center justify-center shrink-0 shadow-lg">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[#ddb049] mb-1">
                          Members Only
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">
                          Sign up to view price
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Create your free account to unlock pricing and buy.
                        </p>
                      </div>
                      <button
                        onClick={openSignIn}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-black shadow-[0_8px_20px_rgba(221,176,73,0.35)] transition-all cursor-pointer shrink-0"
                      >
                        Sign Up Free
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
                      Already have an account?{' '}
                      <button
                        onClick={openSignIn}
                        className="text-[#ddb049] font-bold hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        Price
                      </div>
                      <div className="text-3xl font-black text-slate-900">
                        {price === 0 ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          <>ETB {price.toLocaleString()}</>
                        )}
                      </div>
                    </div>

                    {alreadyOwned ? (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Go to My Downloads
                      </Link>
                    ) : pendingPaymentId ? (
                      <Link
                        href={`/purchase/waiting/${pendingPaymentId}`}
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 text-sm font-bold cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        Payment Pending
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBuy}
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-black shadow-[0_8px_20px_rgba(221,176,73,0.35)] transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {product.description && product.short_description && (
              <div className="bg-white rounded-3xl border border-[#e8e0d2] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 mb-2">Full description</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}