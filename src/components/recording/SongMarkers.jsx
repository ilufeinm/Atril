import React from 'react';
import { Music2 } from 'lucide-react';

const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };

export default function SongMarkers({ songs, currentTime, onSeek }) {
  return (
    <div className="mt-4 -mx-4 sm:-mx-5">
      <div className="flex gap-2 overflow-x-auto px-4 sm:px-5 pb-1 no-scrollbar">
        {songs.map((s, i) => {
          const active = currentTime >= s.start && (s.end == null || currentTime < s.end);
          return (
            <button key={i} onClick={() => onSeek(s.start)} className={`flex items-center gap-2 px-3 h-9 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${active ? 'bg-[#c9ef72] text-[#172013] font-semibold' : 'bg-white/8 text-white/65 hover:bg-white/12'}`}>
              <span className="tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
              <Music2 size={13} className="shrink-0 opacity-70" />
              <span className="max-w-[120px] truncate">{s.title}</span>
              <span className="tabular-nums opacity-50">{fmt(s.start)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}