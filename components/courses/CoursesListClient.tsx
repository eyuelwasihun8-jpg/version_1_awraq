'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Filter,
  Package,
  FileText,
  ArrowRight,
  CheckCircle2,
  Play,
  Award,
  Lock,
} from 'lucide-react';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';
import { preloadThumbnails } from '@/lib/thumbnailCache';
import { useModals } from '@/components/RootLayoutClient';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'digital_marketing', label: 'Digital Marketing' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'language', label: 'Language' },
  { value: 'other', label: 'Other' },
];

type Tab = 'courses' | 'products';

interface Props {
  initialCourses: any[];
  initialProducts: any[];
  enrolledCourseIds?: string[];
  completedCourseIds?: string[];
  purchasedProductIds?: string[];
  isLoggedIn?: boolean;
}

export const CoursesListClient: React.FC<Props> = ({
  initialCourses,
  initialProducts,
  enrolledCourseIds = [],
  completedCourseIds = [],
  purchasedProductIds = [],
  isLoggedIn = false,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState<Tab>('courses');
  const { openSignIn } = useModals();

  const enrolledSet = useMemo(() => new Set(enrolledCourseIds), [enrolledCourseIds]);
  const completedSet = useMemo(() => new Set(completedCourseIds), [completedCourseIds]);
  const purchasedSet = useMemo(() => new Set(purchasedProductIds), [purchasedProductIds]);

  useEffect(() => {
    preloadThumbnails(initialCourses.map((c) => c.thumbnail_url));
  }, [initialCourses]);

  const filteredCourses = useMemo(() => {
    return initialCourses.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || c.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [initialCourses, search, category]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.short_description?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [initialProducts, search]);

  const showEmptyState =
    (tab === 'courses' && filteredCourses.length === 0) ||
    (tab === 'products' && filteredProducts.length === 0);

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-xs sm:text-sm font-black text-[#ddb049] uppercase tracking-widest mb-2">
            Premium Programs &amp; Resources
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Learn with Awraq
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
            Enroll in step-by-step courses or grab ready-to-use digital resources.
          </p>
        </div>

        {/* Sign-up nudge banner for anon users */}
        {!isLoggedIn && (
          <div className="max-w-3xl mx-auto mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#ddb049] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase font-black tracking-widest text-[#ddb049] mb-0.5">
                Members-only pricing
              </div>
              <p className="text-sm font-bold text-slate-800">
                Sign up free to view prices and start buying courses.
              </p>
            </div>
            <button
              type="button"
              onClick={openSignIn}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Sign Up Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TABS */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border border-[#e8e0d2] rounded-2xl p-1.5 shadow-sm">
            <TabButton
              active={tab === 'courses'}
              onClick={() => setTab('courses')}
              icon={BookOpen}
              label={`Courses (${initialCourses.length})`}
            />
            <TabButton
              active={tab === 'products'}
              onClick={() => setTab('products')}
              icon={Package}
              label={`Digital Products (${initialProducts.length})`}
            />
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'courses' ? 'Search courses...' : 'Search products...'}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none bg-white text-sm shadow-sm"
            />
          </div>
          {tab === 'courses' && (
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto pl-11 pr-8 py-3.5 rounded-xl border border-[#e8e0d2] bg-white text-sm font-bold cursor-pointer outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs sm:text-sm text-slate-500 font-medium mb-4">
          {tab === 'courses'
            ? `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`
            : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`}
        </div>

        {showEmptyState ? (
          <div className="bg-white rounded-2xl border border-[#e8e0d2] p-16 text-center">
            {tab === 'courses' ? (
              <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            ) : (
              <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {tab === 'courses' ? 'No courses found' : 'No products found'}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {search
                ? 'Try adjusting your search or filters'
                : tab === 'products'
                  ? 'Digital products will appear here once published'
                  : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : tab === 'courses' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course, i) => {
              const isEnrolled = enrolledSet.has(course.id);
              const isCompleted = completedSet.has(course.id);

              return (
                <Link
                  key={course.id}
                  href={isEnrolled ? `/learn/${course.id}` : `/courses/${course.id}`}
                  className="group bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-lg overflow-hidden transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    <CourseThumbnail
                      thumbnailKey={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100"
                      priority={i < 6}
                    />

                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-slate-700 border border-[#e8e0d2]">
                      {course.category?.replace('_', ' ') || 'Course'}
                    </div>

                    {isCompleted ? (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        <Award className="w-3 h-3" />
                        Completed
                      </div>
                    ) : isEnrolled ? (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Enrolled
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2 group-hover:text-[#ddb049] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2 min-h-[32px]">
                      {course.description || 'No description available'}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-[#f0ebe2] mt-auto gap-2">
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">
                        {course.instructor?.full_name || 'Instructor'}
                      </span>

                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                          <Play className="w-3 h-3" />
                          {isCompleted ? 'Review' : 'Continue'}
                        </span>
                      ) : isLoggedIn ? (
                        <div className="text-sm font-black text-slate-900 shrink-0">
                          ETB {Number(course.price || 0).toLocaleString()}
                        </div>
                      ) : (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openSignIn();
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#ddb049] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0 hover:bg-amber-100 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          Sign Up for Price
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const price = Number(product.price || 0);
              const isOwned = purchasedSet.has(product.id);
              const summary =
                product.short_description ||
                (product.description ? product.description.slice(0, 120) : '');

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group bg-white rounded-2xl border border-[#e8e0d2] shadow-sm hover:shadow-lg overflow-hidden transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {product.thumbnail_url ? (
                      <CourseThumbnail
                        thumbnailKey={product.thumbnail_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                    {isOwned && (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Owned
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-slate-900 mb-1 line-clamp-2 group-hover:text-[#ddb049] transition-colors">
                      {product.title}
                    </h3>
                    {summary && (
                      <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2 min-h-[32px]">
                        {summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-[#f0ebe2] mt-auto">
                      {isOwned ? (
                        <span className="text-xs font-black text-emerald-700">Already owned</span>
                      ) : isLoggedIn ? (
                        <div className="text-sm font-black text-slate-900">
                          {price === 0 ? (
                            <span className="text-emerald-600">Free</span>
                          ) : (
                            <>ETB {price.toLocaleString()}</>
                          )}
                        </div>
                      ) : (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openSignIn();
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#ddb049] bg-amber-50 border border-amber-200 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          Sign Up
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ddb049] group-hover:gap-2 transition-all">
                        {isOwned ? 'Open' : 'View'}
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
};

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
      active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-[#fbfaf7]'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-[#ddb049]' : ''}`} />
    <span>{label}</span>
  </button>
);