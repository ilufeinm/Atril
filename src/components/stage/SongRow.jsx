import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Check } from 'lucide-react';
import HighlightText from './HighlightText';
import { resolvePage } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';

export default function SongRow({ song, query, selectionMode, selected, onToggleSelect, onLongPress, compact }) {
  const nav = useNavigate();
  const pressTimer = useRef(null);
  const longPressed = useRef(false);

  const firstPage = resolvePage(song, 1);
  const thumbUri = firstPage.kind === 'image' ? firstPage.src : null;
  const thumbUrl = useSignedUrl(thumbUri);

  const startPress = () => {
    if (selectionMode) return;
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      if (navigator.vibrate) navigator.vibrate(30);
      onLongPress?.(song);
    }, 500);
  };
  const cancelPress = () => clearTimeout(pressTimer.current);

  const handleClick = () => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (selectionMode) { onToggleSelect(song.id); return; }
    nav(`/en-vivo/${song.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => { if (!selectionMode) { e.preventDefault(); onLongPress?.(song); } }}
      role="button"
      tabIndex={0}
      className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl border transition-colors min-w-0 cursor-pointer select-none ${selectionMode && selected ? 'border-[#8e9aaf] bg-[#8e9aaf]/10' : 'border-white/[.07] bg-[#242831] hover:bg-[#2c313b]'}`}
    >
      <div className="w-10 h-10 rounded-lg bg-[#e9e9dd] text-[#697359] shrink-0 flex items-center justify-center relative overflow-hidden">
        {selectionMode ? (
          <div className={`w-full h-full flex items-center justify-center ${selected ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/40'}`}>
            {selected ? <Check size={18} /> : <Music2 size={16} />}
          </div>
        ) : thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <>
            <div className="absolute inset-x-1.5 border-t border-b border-[#aaa99b]/60 top-3.5 bottom-3.5" />
            <Music2 size={16} className="relative" />
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate flex items-center gap-1.5">
          <HighlightText text={song.title} query={query} />
          {song.is_demo && <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-white/10 text-white/55">Demo</span>}
        </div>
        <div className="text-xs text-white/40 truncate">
          <HighlightText text={song.artist || 'Artista desconocido'} query={query} />
          {!compact && <span className="text-white/30"> · {song.type || 'Chart'} · {song.key || '—'} · {song.bpm || '—'} BPM</span>}
        </div>
      </div>
    </div>
  );
}