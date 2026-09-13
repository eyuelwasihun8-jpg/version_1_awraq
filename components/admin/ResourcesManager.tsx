'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Upload, FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
  lessonTitle: string;
}

type ResourceType = 'pdf' | 'link' | 'file';

export const ResourcesManager: React.FC<Props> = ({ lessonId, lessonTitle }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [type, setType] = useState<ResourceType>('pdf');
  const [title, setTitle] = useState('');
  const [fileKey, setFileKey] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/resources?lessonId=${lessonId}`);
      const data = await res.json();
      setResources(data.resources || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [lessonId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `resources/${lessonId}`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      setFileKey(data.fileKey);
      // Auto-fill title from file name if empty
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      toast.success('File uploaded');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (type === 'link' && !externalUrl.trim()) {
      toast.error('URL is required');
      return;
    }
    if ((type === 'pdf' || type === 'file') && !fileKey) {
      toast.error('Upload a file first');
      return;
    }
    if (type === 'link') {
      try {
        new URL(externalUrl);
      } catch {
        toast.error('Invalid URL');
        return;
      }
    }

    setAdding(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          title: title.trim(),
          resourceType: type,
          fileKey: type !== 'link' ? fileKey : null,
          externalUrl: type === 'link' ? externalUrl.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed');
        return;
      }

      toast.success('Resource added');
      setTitle('');
      setFileKey('');
      setExternalUrl('');
      fetchResources();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Deleted');
      fetchResources();
    } catch {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-900 mb-1">Resources</h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Add PDFs or links for "<span className="font-bold">{lessonTitle}</span>"
        </p>
      </div>

      {/* Existing resources */}
      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-2">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {r.resource_type === 'link' ? (
                  <LinkIcon className="w-3.5 h-3.5 text-[#07CCFD]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#20B486]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{r.title}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {r.resource_type}
                </div>
              </div>
              {r.resource_type === 'link' && r.external_url && (
                <a
                  href={r.external_url}
                  target="_blank"
                  rel="noopener"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-[#07CCFD] cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-slate-500 font-medium">No resources yet</div>
      )}

      {/* Add form */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['pdf', 'file', 'link'] as ResourceType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-lg border-2 text-xs font-bold capitalize cursor-pointer transition-all ${
                type === t
                  ? 'border-[#07CCFD] bg-cyan-50 text-[#07CCFD]'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource title"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-[#07CCFD] outline-none bg-slate-50/50 text-xs"
        />

        {type === 'link' ? (
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-[#07CCFD] outline-none bg-slate-50/50 text-xs font-mono"
          />
        ) : (
          <div className="flex items-center gap-2">
            {fileKey && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 font-mono flex-1 truncate">
                ✓ {fileKey.split('/').pop()}
              </div>
            )}
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                accept={type === 'pdf' ? '.pdf' : '*'}
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={adding || uploading}
          className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{adding ? 'Adding...' : 'Add Resource'}</span>
        </button>
      </div>
    </div>
  );
};