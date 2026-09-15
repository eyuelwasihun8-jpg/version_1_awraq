'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { Globe, Share2, MessageCircle, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenConsultation: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenConsultation }) => {
  return (
    <footer className="bg-[#0D1527] text-gray-400 pt-12 sm:pt-16 pb-8 sm:pb-10 border-t border-gray-800 safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 pb-10 sm:pb-14 border-b border-gray-800">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <BrandLogo variant="light" size="md" />
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Top learning experiences that create more talent in the world of digital marketing.
            </p>
          </div>

          {/* Product */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Learn</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/courses"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  All Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Company</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="/#about"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Social</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="#terms"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="hover:text-white transition-colors py-2 inline-block min-h-[40px]"
                >
                  Privacy
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenConsultation}
                  className="hover:text-white transition-colors py-2 text-left min-h-[40px] text-[#ddb049] font-semibold cursor-pointer"
                >
                  Book Consultation
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Awraq. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-gray-400">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors p-2"
              aria-label="Twitter"
            >
              <Share2 className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors p-2"
              aria-label="LinkedIn"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors p-2"
              aria-label="Facebook"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors p-2"
              aria-label="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};