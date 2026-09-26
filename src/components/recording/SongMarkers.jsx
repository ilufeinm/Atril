import React from 'react';
import { Music2 } from 'lucide-react';

const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };

export default function SongMarkers({ songs, currentTime, onSeek }) {
  return (
    <div className="space-y-1.5">
      {songs.map((s, i) => {
        const active = currentTime >= s.start && (s.end == null || currentTime < s.end);
        return (
          <button key={i} onClick={() => onSeek(s.start)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-sm transition-colors ${active ? 'bg-[#c9ef72]/12 text-[#d8f4a3]' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
            <span className="text-[11px] font-bold text-white/40 w-6">{String(i + 1).padStart(2, '0')}</span>
            <Music2 size={15} className="shrink-0" />
            <span className="flex-1 truncate">{s.title}</span>
            <span className="text-[11px] text-white/40 tabular-nums">{fmt(s.start)}</span>
          </button>
        );
      })}
    </div>
  );
}