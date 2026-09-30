import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Package, FileText, ArrowRight } from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from('digital_products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const list = products || [];

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ddb049] mb-2">
            Awraq Resources
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Digital Products
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl">
            Ready-to-use PDFs, templates, and toolkits to speed up your digital marketing work.
          </p>
        </div>

        {/* Empty state */}
        {list.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#e8e0d2] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-[#ddb049]" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">No products found</h2>
            <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
              Make sure products are toggled to &quot;Published&quot; in the Staff Portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((p) => {
              const price = Number(p.price || 0);
              const isFree = price === 0;
              const summary = p.short_description || p.description || '';

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group bg-white rounded-2xl border border-[#e8e0d2] overflow-hidden hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)] hover:border-[#ddb049]/60 transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative">
                    {p.thumbnail_url ? (
                      <CourseThumbnail
                        thumbnailKey={p.thumbnail_url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
                        <Package className="w-12 h-12 text-[#ddb049]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-[10px] font-black uppercase tracking-wider text-slate-700">
                        <FileText className="w-3 h-3 text-[#ddb049]" />
                        {p.file_type || 'Digital'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1.5 line-clamp-2">
                      {p.title}
                    </h3>
                    {summary && (
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
                        {summary}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-[#f0ebe2]">
                      <div className="text-sm font-black text-slate-900">
                        {isFree ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          <>ETB {price.toLocaleString()}</>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ddb049] group-hover:gap-2 transition-all">
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}