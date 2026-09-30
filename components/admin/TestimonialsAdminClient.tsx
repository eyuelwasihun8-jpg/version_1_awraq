'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  Save,
  Upload,
  Star,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  X,
  Quote,
} from 'lucide-react';
import { toast } from 'sonner';

type Item = {
  id: string;
  name: string;
  role: string;
  quote: string | null;
  rating: number;
  media_type: 'image' | 'video';
  media_key: string | null;
  poster_key: string | null;
  is_published: boolean;
  sort_order: number;
  mediaUrl?: string | null;
  posterUrl?: string | null;
};

const emptyForm = {
  name: '',
  role: 'Awraq Learner',
  quote: '',
  rating: 5,
  mediaType: 'image' as 'image' | 'video',
  mediaKey: '' as string,
  posterKey: '' as string,
  isPublished: true,
  sortOrder: 0,
};

export function TestimonialsAdminClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.testimonials || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isEditingValid = Boolean(
    mode === 'edit' && editingId && items.some((item) => item.id === editingId)
  );

  /**
   * Dedicated Testimonial Binary Upload
   * Calls /api/admin/testimonials/upload directly with raw file bytes
   */
  const uploadFile = async (file: File, folder: string) => {
    setUploading(true);
    try {
      const url = `/api/admin/testimonials/upload?folder=${encodeURIComponent(
        folder
      )}&filename=${encodeURIComponent(file.name)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file, // Raw binary
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.fileKey as string;
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload file');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: items.length });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (t: Item) => {
    setMode('edit');
    setEditingId(t.id);
    setForm({
      name: t.name,
      role: t.role,
      quote: t.quote || '',
      rating: t.rating,
      mediaType: t.media_type,
      mediaKey: t.media_key || '',
      posterKey: t.poster_key || '',
      isPublished: t.is_published,
      sortOrder: t.sort_order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Student name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        quote: form.quote.trim(),
        rating: form.rating,
        mediaType: form.mediaType,
        mediaKey: form.mediaKey || null,
        posterKey: form.mediaType === 'video' ? form.posterKey || null : null,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
      };

      const actualEditingId = isEditingValid ? editingId : null;
      const url = actualEditingId
        ? `/api/admin/testimonials/${actualEditingId}`
        : '/api/admin/testimonials';
      const method = actualEditingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      toast.success(actualEditingId ? 'Testimonial updated!' : 'Testimonial created!');
      closeForm();
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success('Deleted');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Testimonials</h1>
          <p className="text-sm text-slate-500 font-medium">
            Add student stories with photo or compressed video + quote text
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">
              {isEditingValid ? 'Edit Testimonial' : 'New Testimonial'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-500 hover:text-slate-900"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Student name *">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="Sara Kebede"
              />
            </Field>
            <Field label="Role / title">
              <input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="input"
                placeholder="Social Media Manager"
              />
            </Field>
          </div>

          <Field label="Quote / testimonial text">
            <textarea
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              rows={3}
              className="input resize-none"
              placeholder="I landed freelance clients within 3 weeks of finishing..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Rating">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        n <= form.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Sort order">
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                }
                className="input font-mono"
              />
            </Field>

            <Field label="Visibility">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  form.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {form.isPublished ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                {form.isPublished ? 'Published' : 'Draft'}
              </button>
            </Field>
          </div>

          <Field label="Media type">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, mediaType: 'image' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-2 cursor-pointer ${
                  form.mediaType === 'image'
                    ? 'border-[#ddb049] bg-amber-50 text-slate-900'
                    : 'border-[#e8e0d2] text-slate-500'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Photo / Story
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, mediaType: 'video' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-2 cursor-pointer ${
                  form.mediaType === 'video'
                    ? 'border-[#ddb049] bg-amber-50 text-slate-900'
                    : 'border-[#e8e0d2] text-slate-500'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Video
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={
                form.mediaType === 'video'
                  ? 'Video file (mp4, compressed)'
                  : 'Photo (jpg/png/webp)'
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                {form.mediaKey ? (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg truncate max-w-[180px]">
                    ✓ {form.mediaKey}
                  </span>
                ) : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    accept={
                      form.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'
                    }
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        const key = await uploadFile(
                          file,
                          form.mediaType === 'video'
                            ? 'testimonials/videos'
                            : 'testimonials/images'
                        );
                        setForm((f) => ({ ...f, mediaKey: key }));
                        toast.success('Media uploaded!');
                      } catch {
                        // Toast handled in uploadFile
                      }
                    }}
                  />
                </label>
              </div>
            </Field>

            {form.mediaType === 'video' && (
              <Field label="Video poster image (optional)">
                <div className="flex flex-wrap items-center gap-2">
                  {form.posterKey ? (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg truncate max-w-[180px]">
                      ✓ {form.posterKey}
                    </span>
                  ) : null}
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Poster
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const key = await uploadFile(file, 'testimonials/posters');
                          setForm((f) => ({ ...f, posterKey: key }));
                          toast.success('Poster uploaded!');
                        } catch {
                          // Toast handled
                        }
                      }}
                    />
                  </label>
                </div>
              </Field>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 min-h-[48px] py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>
                {saving
                  ? 'Saving...'
                  : isEditingValid
                    ? 'Update Testimonial'
                    : 'Create Testimonial'}
              </span>
            </button>

            <button
              type="button"
              onClick={closeForm}
              className="px-5 min-h-[48px] py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Quote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No testimonials yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;+ Add Testimonial&quot; above to create your first student story
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f0ebe2]">
            {items.map((t) => (
              <li
                key={t.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#fbfaf7]/80"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#e8e0d2]">
                  {t.posterUrl || (t.media_type === 'image' && t.mediaUrl) ? (
                    <img
                      src={t.posterUrl || t.mediaUrl || ''}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      {t.media_type === 'video' ? (
                        <Video className="w-5 h-5 text-[#ddb049]" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-black text-slate-900">{t.name}</span>
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {t.media_type}
                    </span>
                    {!t.is_published && (
                      <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mb-1">{t.role}</div>
                  {t.quote && (
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      “{t.quote}”
                    </p>
                  )}
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      order {t.sort_order}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e8e0d2;
          background: rgba(251, 250, 247, 0.5);
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #ddb049;
          box-shadow: 0 0 0 2px rgba(221, 176, 73, 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}