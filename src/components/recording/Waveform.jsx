import React from 'react';

export default function Waveform({ peaks, progress, onSeek }) {
  return (
    <div className="relative h-16 flex items-center gap-[2px] cursor-pointer" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}>
      {peaks.map((p, i) => (
        <div key={i} className="flex-1 rounded-full" style={{ height: `${Math.max(6, p * 100)}%`, background: (i / peaks.length) <= progress ? '#c9ef72' : 'rgba(255,255,255,.18)' }} />
      ))}
      {!peaks.length && <div className="w-full h-1.5 bg-white/10 rounded-full" />}
    </div>
  );
}