import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Check } from 'lucide-react';
import { Image } from '@/components/ui/image';
import HighlightText from './HighlightText';
import { resolvePage } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';

export default function SongCard({ song, query, selectionMode, selected, onToggleSelect, onLongPress }) {
  const nav = useNavigate();
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const resolved = resolvePage(song, 1);
  const isImage = resolved.kind === 'image';
  const signedSrc = useSignedUrl(isImage ? resolved.src : null);
  const hasImage = isImage && !!signedSrc;

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
      className={`relative rounded-xl overflow-hidden border cursor-pointer select-none transition-colors ${selectionMode && selected ? 'border-[#8e9aaf] ring-1 ring-[#8e9aaf]' : 'border-white/[.07] bg-[#242831] hover:bg-[#2c313b]'}`}
    >
      <div className="aspect-[3/4] bg-[#e9e9dd] flex items-center justify-center relative">
        {hasImage ? <Image src={signedSrc} fittingType="fit" className="w-full h-full" /> : <Music2 size={28} className="text-[#697359]" />}
        {selectionMode && (
          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${selected ? 'bg-[#8e9aaf]' : 'bg-black/50'}`}>
            {selected && <Check size={14} className="text-[#121212]" />}
          </div>
        )}
        {song.is_demo && !selectionMode && <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/60 text-white/70">Demo</span>}
      </div>
      <div className="p-2.5">
        <div className="font-semibold text-sm truncate"><HighlightText text={song.title} query={query} /></div>
        <div className="text-xs text-white/40 truncate"><HighlightText text={song.artist || 'Artista desconocido'} query={query} /></div>
      </div>
    </div>
  );
}