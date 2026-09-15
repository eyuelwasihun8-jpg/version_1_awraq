'use client';

import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, Loader2, Link as LinkIcon } from 'lucide-react';

interface Props {
  lessonId: string;
}

export const ResourcesPanel: React.FC<Props> = ({ lessonId }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/resources?lessonId=${lessonId}`);
        const data = await res.json();
        setResources(data.resources || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">No resources for this lesson</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resources.map((r) => (
        <a
          key={r.id}
          href={r.download_url || r.external_url}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 p-3 rounded-xl bg-[#fbfaf7] hover:bg-slate-100 border border-[#e8e0d2] cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-white border border-[#e8e0d2] flex items-center justify-center shrink-0">
            {r.resource_type === 'link' ? (
              <LinkIcon className="w-4 h-4 text-[#ddb049]" />
            ) : (
              <FileText className="w-4 h-4 text-[#20B486]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{r.title}</div>
            <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
              {r.resource_type}
            </div>
          </div>
          {r.resource_type === 'link' ? (
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <Download className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </a>
      ))}
    </div>
  );
};