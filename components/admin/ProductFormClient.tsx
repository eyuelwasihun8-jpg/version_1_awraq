'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, Save, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'template', label: 'Template' },
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'other', label: 'Other' },
];

interface Props {
  product?: any;
}

export const ProductFormClient: React.FC<Props> = ({ product }) => {
  const router = useRouter();
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '0');
  const [fileType, setFileType] = useState(product?.file_type || 'pdf');
  const [fileKey, setFileKey] = useState(product?.file_key || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnail_url || '');
  const [isPublished, setIsPublished] = useState(!!product?.is_published);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);

  const uploadToServer = async (file: File, folder: string): Promise<string | null> => {
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
    }
  };

  // Direct browser → R2 with progress bar (for large files)
  const uploadWithProgress = async (file: File, folder: string): Promise<string | null> => {
    try {
      // Get signed URL
      const urlRes = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'application/pdf',
          folder,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        toast.error(urlData.error || 'Failed to get upload URL');
        return null;
      }

      const { uploadUrl, fileKey: newFileKey } = urlData;

      // Upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setFileProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      return newFileKey;
    } catch {
      toast.error('Upload failed. Check R2 CORS.');
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large (max 100MB)');
      return;
    }

    setUploadingFile(true);
    setFileProgress(0);

    const key = await uploadWithProgress(file, 'products');
    if (key) {
      setFileKey(key);
      toast.success('File uploaded!');
    }
    setUploadingFile(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }

    setUploadingThumb(true);
    const key = await uploadToServer(file, 'products/thumbnails');
    if (key) {
      setThumbnailUrl(key);
      toast.success('Thumbnail uploaded!');
    }
    setUploadingThumb(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!fileKey) {
      toast.error('Please upload the product file');
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          price: parseFloat(price) || 0,
          fileKey,
          fileType,
          thumbnailUrl,
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }

      toast.success(isEdit ? 'Product updated' : 'Product created');
      router.push(`/${PORTAL_SLUG}/products`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm('Delete this product?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Product deleted');
      router.push(`/${PORTAL_SLUG}/products`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/${PORTAL_SLUG}/products`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            {isEdit ? 'Edit Product' : 'New Digital Product'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isEdit ? 'Update product details' : 'Add a downloadable PDF or template'}
          </p>
        </div>
        {isEdit && (
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        <Field label="Product Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete SEO Checklist PDF"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] focus:ring-2 focus:ring-cyan-100 outline-none bg-slate-50/50 text-sm"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What's included in this product?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none bg-slate-50/50 text-sm resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="File Type">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none bg-slate-50/50 text-sm font-bold cursor-pointer"
            >
              {FILE_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#07CCFD] outline-none bg-slate-50/50 text-sm font-mono"
            />
          </Field>
        </div>

        {/* Product file upload */}
        <Field label="Product File * (PDF, ZIP, etc.)">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {fileKey ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 font-mono max-w-full truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{fileKey.split('/').pop()}</span>
                </div>
              ) : null}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
                {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingFile ? 'Uploading...' : fileKey ? 'Replace File' : 'Upload File'}</span>
                <input
                  type="file"
                  accept=".pdf,.zip,.doc,.docx,.xlsx,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
            </div>

            {uploadingFile && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Uploading...</span>
                  <span>{fileProgress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#07CCFD] transition-all"
                    style={{ width: `${fileProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Thumbnail */}
        <Field label="Thumbnail Image (optional)">
          <div className="flex items-center gap-3 flex-wrap">
            {thumbnailUrl && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 font-mono max-w-[220px] truncate">
                ✓ {thumbnailUrl}
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
              {uploadingThumb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploadingThumb ? 'Uploading...' : 'Upload Thumbnail'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
                disabled={uploadingThumb}
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
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
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
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              Published
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingFile}
          className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#07CCFD] hover:bg-[#06B8E4] border-b-[4px] border-[#05A3CA] hover:border-b-[2px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}</span>
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