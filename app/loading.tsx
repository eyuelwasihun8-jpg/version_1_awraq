import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-[#ddb049]/20 border-t-[#ddb049] animate-spin" />
        {/* Center Dot */}
        <div className="absolute w-3 h-3 rounded-full bg-[#ddb049] animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading Awraq...
      </p>
    </div>
  );
}