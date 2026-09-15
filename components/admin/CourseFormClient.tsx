'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

const CATEGORIES = [
  { value: 'digital_marketing', label: 'Digital Marketing' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'language', label: 'Language' },
  { value: 'other', label: 'Other' },
];

interface Props {
  course?: any;
}

export const CourseFormClient: React.FC<Props> = ({ course }) => {
  const router = useRouter();
  const isEdit = !!course;

  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [category, setCategory] = useState(course?.category || 'digital_marketing');
  const [price, setPrice] = useState(course?.price?.toString() || '0');
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || '');
  const [certKey, setCertKey] = useState(course?.certificate_template_key || '');
  const [isPublished, setIsPublished] = useState(!!course?.is_published);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Server-side upload function (Zero CORS issues!)
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return null;
      }

      return data.fileKey;
    } catch {
      toast.error('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const key = await uploadFile(file, 'thumbnails');
    if (key) {
      setThumbnailUrl(key);
      toast.success('Thumbnail uploaded successfully!');
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = await uploadFile(file, 'certificates/templates');
    if (key) {
      setCertKey(key);
      toast.success('Certificate template uploaded!');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/courses/${course.id}` : '/api/admin/courses';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          category,
          price: parseFloat(price) || 0,
          thumbnailUrl,
          certificateTemplateKey: certKey,
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save course');
        return;
      }

      toast.success(isEdit ? 'Course updated' : 'Course created');

      if (!isEdit) {
        router.push(`/${PORTAL_SLUG}/courses/${data.course.id}`);
      } else {
        router.push(`/${PORTAL_SLUG}/courses`);
        router.refresh();
      }
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm('Delete this course? All lessons will be removed.')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete');
        return;
      }
      toast.success('Course deleted');
      router.push(`/${PORTAL_SLUG}/courses`);
    } catch {
      toast.error('Delete failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/${PORTAL_SLUG}/courses`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            {isEdit ? 'Edit Course' : 'New Course'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isEdit ? 'Update course details' : 'Fill in the details to create a course'}
          </p>
        </div>

        {isEdit && (
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 cursor-pointer transition-all"
            title="Delete course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 sm:p-6 space-y-5">
        <Field label="Course Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master Digital Marketing"
            className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7]/50 text-sm"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What will students learn in this course?"
            className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7]/50 text-sm resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none bg-[#fbfaf7]/50 text-sm font-bold cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Price (ETB)">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="10"
              className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] outline-none bg-[#fbfaf7]/50 text-sm font-mono"
            />
          </Field>
        </div>

        <Field label="Thumbnail Image">
          <div className="flex items-center gap-3 flex-wrap">
            {thumbnailUrl ? (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 font-mono max-w-[220px] truncate">
                ✓ {thumbnailUrl}
              </div>
            ) : null}

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </Field>

        <Field label="Certificate Template (PNG/JPG)">
          <div className="flex items-center gap-3 flex-wrap">
            {certKey ? (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 font-mono">
                ✓ Uploaded
              </div>
            ) : null}

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading...' : 'Upload Template'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleCertUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </Field>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Publish Status</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublished(false)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                !isPublished
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-[#e8e0d2] bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setIsPublished(true)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                isPublished
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-[#e8e0d2] bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              Published
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}</span>
        </button>
      </div>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}