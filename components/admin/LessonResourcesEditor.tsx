'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  File,
  Presentation,
  X,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  resource_type: 'pdf' | 'link' | 'file';
  file_key?: string | null;
  external_url?: string | null;
  created_at?: string;
}

interface Props {
  lessonId: string;
}

function detectResourceType(file: File): 'pdf' | 'file' {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'file';
}

function iconFor(resource: Resource) {
  if (resource.resource_type === 'link') return ExternalLink;
  if (resource.resource_type === 'pdf') return FileText;
  const key = (resource.file_key || resource.title || '').toLowerCase();
  if (key.endsWith('.ppt') || key.endsWith('.pptx')) return Presentation;
  return File;
}

export const LessonResourcesEditor: React.FC<Props> = ({ lessonId }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/resources?lessonId=${lessonId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to load resources');
        return;
      }
      setResources(data.resources || []);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [lessonId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large. Max ${maxMb}MB`);
      return;
    }

    setUploading(true);
    try {
      // 1) Get presigned upload URL
      const urlRes = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'application/octet-stream',
          folder: `resources/${lessonId}`,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        toast.error(urlData.error || 'Failed to get upload URL');
        return;
      }

      // 2) Upload file to R2
      const putRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!putRes.ok) {
        toast.error('Upload to storage failed');
        return;
      }

      // 3) Save resource row
      const resourceType = detectResourceType(file);
      const title = file.name.replace(/\.[^/.]+$/, '') || file.name;

      const saveRes = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          title,
          resourceType,
          fileKey: urlData.fileKey,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        toast.error(saveData.error || 'Failed to save resource');
        return;
      }

      toast.success('Resource uploaded');
      fetchResources();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!linkUrl.trim()) {
      toast.error('URL is required');
      return;
    }
    try {
      // Basic URL check
      // eslint-disable-next-line no-new
      new URL(linkUrl.trim());
    } catch {
      toast.error('Enter a valid URL (https://...)');
      return;
    }

    setSavingLink(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          title: linkTitle.trim(),
          resourceType: 'link',
          externalUrl: linkUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add link');
        return;
      }
      toast.success('Link added');
      setLinkTitle('');
      setLinkUrl('');
      setAddingLink(false);
      fetchResources();
    } finally {
      setSavingLink(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete');
        return;
      }
      toast.success('Resource deleted');
      setResources((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-[#f0ebe2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ddb049]" />
              Lesson Resources
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              PDFs, PowerPoints, documents, or external links students can download
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? 'Uploading…' : 'Upload File'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAddingLink((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fbfaf7] border border-[#e8e0d2] hover:bg-white text-slate-800 text-xs font-bold cursor-pointer transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Add link form */}
        {addingLink && (
          <div className="px-5 sm:px-6 py-4 bg-amber-50/40 border-b border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                New external link
              </span>
              <button
                type="button"
                onClick={() => {
                  setAddingLink(false);
                  setLinkTitle('');
                  setLinkUrl('');
                }}
                className="p-1 rounded-lg hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Title (e.g. Google Drive folder)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-white text-sm"
              />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-white text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={savingLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] text-[#0a0704] text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {savingLink ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Save Link</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : resources.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#e8e0d2] rounded-2xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-black text-slate-900 mb-1">No resources yet</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Upload PDFs, PowerPoint decks, or add links. Students will see them in the lesson
                Resources tab.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {resources.map((r) => {
                const Icon = iconFor(r);
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-[#e8e0d2] bg-[#fbfaf7] hover:bg-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e0d2] flex items-center justify-center shrink-0">
                      <Icon
                        className={`w-4 h-4 ${
                          r.resource_type === 'link'
                            ? 'text-[#ddb049]'
                            : r.resource_type === 'pdf'
                              ? 'text-red-500'
                              : 'text-slate-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">{r.title}</div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mt-0.5">
                        {r.resource_type === 'link'
                          ? 'External Link'
                          : r.resource_type === 'pdf'
                            ? 'PDF'
                            : 'File'}
                        {r.external_url ? (
                          <span className="normal-case font-medium tracking-normal text-slate-400 ml-2 truncate inline-block max-w-[200px] align-bottom">
                            {r.external_url}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {r.resource_type === 'link' && r.external_url && (
                      <a
                        href={r.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {resources.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {resources.length} resource{resources.length !== 1 ? 's' : ''} · visible to enrolled
                students
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 font-medium mt-3 text-center">
        Supported: PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX, ZIP, images, or any file · Max 50MB
      </p>
    </div>
  );
};