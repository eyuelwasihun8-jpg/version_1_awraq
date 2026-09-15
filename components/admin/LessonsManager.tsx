'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Video,
  FileText,
  Loader2,
  Upload,
  CheckCircle2,
  Eye,
  X,
  ArrowUp,
  ArrowDown,
  Settings,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResourcesManager } from './ResourcesManager';

interface Props {
  courseId: string;
}

export const LessonsManager: React.FC<Props> = ({ courseId }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reordering, setReordering] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'video' | 'text'>('video');
  const [newVideoKey, setNewVideoKey] = useState('');
  const [newText, setNewText] = useState('');
  const [newDuration, setNewDuration] = useState('0');

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lessons?courseId=${courseId}`);
      const data = await res.json();
      setLessons(data.lessons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'video/mp4',
          folder: `courses/${courseId}/lessons`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to get upload URL');
        return;
      }

      const { uploadUrl, fileKey } = data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setNewVideoKey(fileKey);

      // Detect duration
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        setNewDuration(Math.round(videoEl.duration).toString());
        URL.revokeObjectURL(videoEl.src);
      };
      videoEl.src = URL.createObjectURL(file);

      toast.success('Video uploaded!');
    } catch {
      toast.error('Upload failed. Check R2 CORS.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newTitle.trim()) {
      toast.error('Title required');
      return;
    }
    if (newType === 'video' && !newVideoKey) {
      toast.error('Upload video first');
      return;
    }
    if (newType === 'text' && !newText.trim()) {
      toast.error('Text content required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: newTitle.trim(),
          lessonType: newType,
          videoKey: newType === 'video' ? newVideoKey : null,
          textContent: newType === 'text' ? newText : null,
          orderIndex: lessons.length,
          durationSeconds: parseInt(newDuration) || 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed');
        return;
      }
      toast.success('Lesson added!');
      setNewTitle('');
      setNewVideoKey('');
      setNewText('');
      setNewDuration('0');
      setUploadProgress(0);
      fetchLessons();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' });
      if (!res.ok) return toast.error('Failed');
      toast.success('Deleted');
      fetchLessons();
    } catch {}
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...lessons];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setLessons(newList);
  };

  const moveDown = (index: number) => {
    if (index === lessons.length - 1) return;
    const newList = [...lessons];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    setLessons(newList);
  };

  const saveOrder = async () => {
    setReordering(true);
    try {
      const lessonOrders = lessons.map((l, i) => ({ id: l.id, order_index: i }));
      const res = await fetch('/api/admin/lessons/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonOrders }),
      });
      if (!res.ok) {
        toast.error('Failed to save order');
        return;
      }
      toast.success('Order saved!');
      fetchLessons();
    } finally {
      setReordering(false);
    }
  };

  const orderChanged = lessons.some((l, i) => l.order_index !== i);

  const openPreview = async (lesson: any) => {
    setPreviewLoading(true);
    setPreviewLesson(lesson);
    setPreviewUrl(null);

    if (lesson.lesson_type === 'video') {
      try {
        const res = await fetch(`/api/admin/lessons/${lesson.id}`);
        const data = await res.json();
        if (res.ok && data.videoUrl) {
          setPreviewUrl(data.videoUrl);
        }
      } catch {}
    }
    setPreviewLoading(false);
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-1">Lessons ({lessons.length})</h2>
          <p className="text-xs text-slate-500 font-medium">
            Add, reorder, and manage course lessons
          </p>
        </div>

        {orderChanged && (
          <button
            onClick={saveOrder}
            disabled={reordering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
          >
            {reordering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Order</span>
          </button>
        )}
      </div>

      {/* Lessons list */}
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-medium">No lessons yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lessons.map((l, i) => (
              <div key={l.id}>
                <div className="flex items-center gap-3 p-4 hover:bg-[#fbfaf7]">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-0.5 rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === lessons.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-xs font-black text-slate-400 w-6 text-center">{i + 1}</div>

                  {l.lesson_type === 'video' ? (
                    <Video className="w-4 h-4 text-[#ddb049] shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#20B486] shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{l.title}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {l.lesson_type === 'video'
                        ? `Video · ${l.duration_seconds || 0}s`
                        : `Text · ~${l.duration_seconds || 60}s read`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPreview(l)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        expandedId === l.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Manage Resources"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded resources manager */}
                {expandedId === l.id && (
                  <div className="p-4 bg-[#fbfaf7] border-t border-[#f0ebe2]">
                    <ResourcesManager lessonId={l.id} lessonTitle={l.title} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new lesson form */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-[#e8e0d2] p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New Lesson</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Lesson Title *</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. 1.1 Introduction to Digital Marketing"
            className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#ddb049] focus:ring-2 focus:ring-amber-100 outline-none bg-[#fbfaf7]/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Lesson Format</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewType('video')}
              className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                newType === 'video'
                  ? 'border-[#ddb049] bg-amber-50 text-[#ddb049]'
                  : 'border-[#e8e0d2] bg-white text-slate-600'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Lesson
            </button>
            <button
              type="button"
              onClick={() => setNewType('text')}
              className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                newType === 'text'
                  ? 'border-[#20B486] bg-emerald-50 text-[#20B486]'
                  : 'border-[#e8e0d2] bg-white text-slate-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Text Reading
            </button>
          </div>
        </div>

        {newType === 'video' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Video File *</label>
            <div className="flex items-center gap-3 flex-wrap">
              {newVideoKey && (
                <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ready ({newDuration}s)</span>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploading ? 'Uploading...' : 'Choose Video File'}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="space-y-1.5 bg-[#fbfaf7] p-3 rounded-xl border border-[#e8e0d2]">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Uploading to R2...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ddb049] transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {newType === 'text' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Text Content (HTML supported)
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={6}
                placeholder="<h2>Lesson Content</h2><p>Write your lesson here...</p>"
                className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] focus:border-[#20B486] outline-none bg-[#fbfaf7]/50 text-sm font-mono resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Estimated Read Time (seconds)
              </label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                min="30"
                className="w-full px-4 py-3 rounded-xl border border-[#e8e0d2] outline-none bg-[#fbfaf7]/50 text-sm font-mono"
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleAddLesson}
          disabled={adding || uploading}
          className="w-full min-h-[48px] py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{adding ? 'Saving Lesson...' : 'Add Lesson'}</span>
        </button>
      </div>

      {/* Preview Modal */}
      {previewLesson && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setPreviewLesson(null);
            setPreviewUrl(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#f0ebe2]">
              <div>
                <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Lesson Preview
                </div>
                <h3 className="text-base font-black text-slate-900">{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => {
                  setPreviewLesson(null);
                  setPreviewUrl(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {previewLoading ? (
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                </div>
              ) : previewLesson.lesson_type === 'video' ? (
                previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full aspect-video rounded-xl bg-black"
                  />
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-sm text-slate-500 font-medium">
                    Video unavailable
                  </div>
                )
              ) : (
                <article
                  className="prose prose-slate max-w-none bg-[#fbfaf7] rounded-xl p-4"
                  dangerouslySetInnerHTML={{
                    __html: previewLesson.text_content || '<p>No content</p>',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};