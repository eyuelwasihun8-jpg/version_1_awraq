'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  User,
  Mail,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [topic, setTopic] = useState('Website & Sales Funnel Review');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessType: '',
    notes: '',
    timeSlot: 'Morning (09:00 - 12:00 UTC)',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsSubmitted(false);
      setStep(1);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const topics = [
    {
      id: 'audit',
      title: 'Website & Sales Funnel Review',
      desc: 'Look at your website and find out why visitors leave without buying.',
    },
    {
      id: 'copywriting',
      title: 'Copywriting & Headline Review',
      desc: 'Rewrite your homepage, sales page, or emails so people understand your offer quickly.',
    },
    {
      id: 'acquisition',
      title: 'Google SEO & Content Plan',
      desc: 'Build a plan to get steady search visitors looking for what you sell.',
    },
    {
      id: 'mentorship',
      title: 'General Marketing Advice',
      desc: 'Ask any questions about pricing, customer retention, or growing your business.',
    },
  ];

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
          business_type: formData.businessType,
          topic,
          notes: formData.notes,
          time_slot: formData.timeSlot,
          source: 'consultation_modal',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit. Please try again.');
        setLoading(false);
        return;
      }

      setIsSubmitted(true);
      toast.success('Request received!');
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    setFormData({
      name: '',
      email: '',
      businessType: '',
      notes: '',
      timeSlot: 'Morning (09:00 - 12:00 UTC)',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e8e0d2] overflow-hidden my-0 sm:my-8 max-h-[94dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#047857] text-white p-5 sm:p-8 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="inline-block text-xs uppercase tracking-widest text-emerald-300 font-semibold mb-2">
            1-on-1 Consultation
          </span>
          <h3 className="text-xl sm:text-3xl font-bold text-white pr-12 leading-tight">
            Book a Consultation with Lamlak
          </h3>
          <p className="text-emerald-100 text-sm mt-2 max-w-lg leading-relaxed">
            Get personal advice for your business, website, or marketing questions directly from Lamlak.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 safe-bottom">
          {isSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">Request Received!</h4>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-slate-900">{formData.name}</span>.
                Lamlak will email you at{' '}
                <span className="font-medium text-slate-900">{formData.email}</span> within 24 hours
                to confirm your time and send a link.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="min-h-[48px] bg-[#064E3B] hover:bg-[#022c22] text-white text-sm font-semibold px-8 py-3 rounded-full cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-900">
                    Step 1 of 2: Choose what you would like help with
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {topics.map((topicItem) => (
                      <button
                        type="button"
                        key={topicItem.id}
                        onClick={() => setTopic(topicItem.title)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left min-h-0 ${
                          topic === topicItem.title
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-[#e8e0d2] hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-bold text-slate-900">{topicItem.title}</h5>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              topic === topicItem.title
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {topic === topicItem.title && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {topicItem.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end sticky bottom-0 bg-white pb-1">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 min-h-[48px] bg-[#064E3B] hover:bg-[#022c22] text-white text-sm font-semibold px-6 py-3 rounded-full cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <span>Continue to Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0ebe2] gap-2">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full truncate">
                      Topic: {topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer shrink-0 py-2"
                    >
                      Change
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Sarah Connor"
                          className="w-full pl-10 pr-3.5 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="sarah@example.com"
                          className="w-full pl-10 pr-3.5 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Business or Project
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.businessType}
                          onChange={(e) =>
                            setFormData({ ...formData, businessType: e.target.value })
                          }
                          placeholder="e.g. Online Store, Service, Agency"
                          className="w-full pl-10 pr-3.5 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Time of Day
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                        <select
                          value={formData.timeSlot}
                          onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white appearance-none"
                        >
                          <option>Morning (09:00 - 12:00 UTC)</option>
                          <option>Afternoon (13:00 - 16:00 UTC)</option>
                          <option>Evening (17:00 - 20:00 UTC)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      What would you like help with?
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Share your website link or tell us about your main challenge..."
                      className="w-full px-3.5 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer py-3 text-center sm:text-left"
                    >
                      ← Back to topic
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 min-h-[48px] bg-[#064E3B] hover:bg-[#022c22] text-white text-sm font-semibold px-7 py-3 rounded-full cursor-pointer shadow-sm w-full sm:w-auto disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 text-emerald-300" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};