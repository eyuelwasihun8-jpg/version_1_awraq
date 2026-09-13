'use client';

import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ContactSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          topic: formData.subject,
          notes: formData.message,
          source: 'contact_form',
        }),
      });

      if (res.ok) {
        toast.success('Message sent! We will get back to you shortly.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-28 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Contact Us
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Have a question or need help? Send us a message.
          </p>
        </div>

        <div className="bg-white border border-slate-200 shadow-lg rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 md:p-10">
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#07CCFD] focus:ring-1 focus:ring-[#07CCFD] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#07CCFD] focus:ring-1 focus:ring-[#07CCFD] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="How can we help?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#07CCFD] focus:ring-1 focus:ring-[#07CCFD] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Message</label>
              <textarea
                rows={4}
                required
                placeholder="Write your message here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#07CCFD] focus:ring-1 focus:ring-[#07CCFD] transition-all resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] text-[#0F172A] font-black shadow-[0_8px_20px_rgba(7,204,253,0.3)] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};