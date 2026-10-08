import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cardMotion, SPRING_BOUNCY } from '@/lib/motion';
import { heroIn } from '@/lib/hero';
import BlurUp from '@/components/motion/BlurUp';
import { Image } from '@/components/ui/image';
import HighlightText from './HighlightText';
import { resolvePage } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';

export default function SongCard({ song, query, selectionMode, selected, onToggleSelect, onLongPress, index = 0 }) {
  const nav = useNavigate();
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const thumbRef = useRef(null);
  const resolved = resolvePage(song, 1);
  const thumbUri = song?.thumb_url || (resolved.kind === 'image' ? resolved.src : null);
  const signedSrc = useSignedUrl(thumbUri);
  const hasImage = !!signedSrc;

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
    if (hasImage) heroIn(song.id, thumbRef.current, signedSrc);
    nav(`/en-vivo/${song.id}`);
  };

  return (
    <motion.div
      {...cardMotion(index)}
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => { if (!selectionMode) { e.preventDefault(); onLongPress?.(song); } }}
      className={`relative rounded-xl overflow-hidden border cursor-pointer select-none transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-xl hover:shadow-black/30 ${selectionMode && selected ? 'border-[#8e9aaf] ring-1 ring-[#8e9aaf]' : 'border-white/[.07] bg-[#242831] hover:bg-[#2c313b]'}`}
    >
      <div ref={thumbRef} data-hero-id={song.id} className="aspect-[3/4] bg-[#e9e9dd] flex items-center justify-center relative">
        {hasImage ? <BlurUp className="w-full h-full"><Image src={signedSrc} fittingType="fit" className="w-full h-full" /></BlurUp> : <Music2 size={28} className="text-[#697359]" />}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              key="sel"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={SPRING_BOUNCY}
              className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${selected ? 'bg-[#8e9aaf]' : 'bg-black/50'}`}
            >
              {selected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_BOUNCY} className="flex">
                  <Check size={14} className="text-[#121212]" />
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {song.is_demo && !selectionMode && <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/60 text-white/70">Demo</span>}
      </div>
      <div className="p-2.5">
        <div className="font-semibold text-sm truncate"><HighlightText text={song.title} query={query} /></div>
        <div className="text-xs text-white/40 truncate"><HighlightText text={song.artist || 'Artista desconocido'} query={query} /></div>
      </div>
    </motion.div>
  );
}