'use client';

import React, { useState } from 'react';
import { Video, Upload, Loader2, Save, CheckCircle2, Trash2, Play, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  lesson: any;
  courseId: string;
  onSaved: () => void;
}

export const LessonVideoEditor: React.FC<Props> = ({ lesson, courseId, onSaved }) => {
  const [videoKey, setVideoKey] = useState(lesson.video_key || '');
  const [detectedDuration, setDetectedDuration] = useState(lesson.duration_seconds || 0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const formatDuration = (s: number) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setVideoKey(fileKey);

      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const localUrl = URL.createObjectURL(file);
      videoEl.onloadedmetadata = () => {
        const dur = Math.round(videoEl.duration || 0);
        setDetectedDuration(dur);
        toast.success(`Video ready! Duration: ${formatDuration(dur)}`);
      };
      videoEl.src = localUrl;
      setVideoPreviewUrl(localUrl);
    } catch {
      toast.error('Upload failed. Check R2 CORS.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!videoKey) {
      toast.error('Please upload a video first');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoKey,
          durationSeconds: detectedDuration || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Video saved!');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the video from this lesson?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoKey: null, durationSeconds: 0 }),
      });
      if (!res.ok) {
        toast.error('Failed to remove');
        return;
      }
      toast.success('Video removed');
      setVideoKey('');
      setDetectedDuration(0);
      setVideoPreviewUrl(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    videoKey !== (lesson.video_key || '') ||
    detectedDuration !== (lesson.duration_seconds || 0);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6 text-[#ddb049]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Video Section</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Upload a video. Duration is detected automatically.
            </p>
          </div>
        </div>

        {(videoKey || videoPreviewUrl) && (
          <div className="mb-5 rounded-2xl overflow-hidden bg-slate-900 aspect-video">
            {videoPreviewUrl ? (
              <video src={videoPreviewUrl} controls className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <Play className="w-8 h-8 mb-2 opacity-70" />
                <div className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(detectedDuration)}
                </div>
              </div>
            )}
          </div>
        )}

        {detectedDuration > 0 && (
          <div className="mb-5 flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Clock className="w-4 h-4 text-[#ddb049]" />
            <div>
              <div className="text-[10px] uppercase font-black bg-amber-800 tracking-wider">
                Detected Duration
              </div>
              <div className="text-lg font-black text-slate-900">
                {formatDuration(detectedDuration)}
                <span className="text-xs text-slate-500 font-medium ml-2">
                  ({detectedDuration}s)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            {videoKey ? 'Replace Video' : 'Upload Video'}
          </label>
          <label className="flex items-center gap-2 w-fit px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? 'Uploading...' : 'Choose Video File'}</span>
            <input type="file" accept="video/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>

          {uploading && (
            <div className="mt-3 bg-[#fbfaf7] p-3 rounded-xl border border-[#e8e0d2]">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#ddb049] transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-5 border-t border-[#f0ebe2] flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving || uploading || !hasChanges || !videoKey}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[3px] border-[#b8862f] text-[#0a0704] text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Video Section'}</span>
          </button>

          {lesson.video_key && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Video
            </button>
          )}

          {hasChanges && (
            <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Unsaved changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};