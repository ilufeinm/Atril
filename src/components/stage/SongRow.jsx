import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Check } from 'lucide-react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import { EASE_OUT, SPRING, SPRING_BOUNCY, itemDelay } from '@/lib/motion';
import { heroIn } from '@/lib/hero';
import BlurUp from '@/components/motion/BlurUp';
import HighlightText from './HighlightText';
import { resolvePage } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';

export default function SongRow({ song, query, selectionMode, selected, onToggleSelect, onLongPress, compact, index = 0, onSwipeFavorite, onSwipeDelete }) {
  const nav = useNavigate();
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const thumbRef = useRef(null);
  const dragged = useRef(false);
  const swipeable = !selectionMode && !!(onSwipeFavorite || onSwipeDelete);
  const x = useMotionValue(0);
  const favOpacity = useTransform(x, [0, 40, 90], [0, 0.6, 1]);
  const favScale = useTransform(x, [0, 90], [0.5, 1.15]);
  const delOpacity = useTransform(x, [0, -40, -90], [0, 0.6, 1]);
  const delScale = useTransform(x, [0, -90], [0.5, 1.15]);

  const firstPage = resolvePage(song, 1);
  const thumbUri = song?.thumb_url || (firstPage.kind === 'image' ? firstPage.src : null);
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
    if (dragged.current) return;
    if (longPressed.current) { longPressed.current = false; return; }
    if (selectionMode) { onToggleSelect(song.id); return; }
    if (thumbUrl) heroIn(song.id, thumbRef.current, thumbUrl);
    nav(`/en-vivo/${song.id}`);
  };

  const onDragEnd = (_, info) => {
    const off = info.offset.x;
    if (off > 90 && onSwipeFavorite) { navigator.vibrate?.(15); onSwipeFavorite(song); }
    else if (off < -90 && onSwipeDelete) { navigator.vibrate?.(15); onSwipeDelete(song); }
    animate(x, 0, SPRING);
    setTimeout(() => { dragged.current = false; }, 60);
  };

  const row = (
    <motion.div
      style={{ x }}
      drag={swipeable ? 'x' : false}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: onSwipeDelete ? 0.45 : 0.03, right: onSwipeFavorite ? 0.45 : 0.03 }}
      onDragStart={() => { dragged.current = true; clearTimeout(pressTimer.current); }}
      onDragEnd={onDragEnd}
      initial={index > 20 ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT, delay: itemDelay(index, 0.035) } }}
      whileTap={{ scale: 0.985, transition: SPRING }}
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => { if (!selectionMode) { e.preventDefault(); onLongPress?.(song); } }}
      role="button"
      tabIndex={0}
      className={`press-none group flex items-center gap-3 px-2.5 py-2 rounded-xl border transition-[background-color,border-color] duration-200 min-w-0 cursor-pointer select-none ${selectionMode && selected ? 'border-[#8e9aaf] bg-[#8e9aaf]/10' : 'border-white/[.07] bg-[#242831] hover:bg-[#2c313b]'}`}
    >
      <div ref={thumbRef} data-hero-id={song.id} className="w-10 h-10 rounded-lg bg-[#e9e9dd] text-[#697359] shrink-0 flex items-center justify-center relative overflow-hidden">
        {selectionMode ? (
          <div className={`w-full h-full flex items-center justify-center ${selected ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/40'}`}>
            {selected ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_BOUNCY} className="flex"><Check size={18} /></motion.span> : <Music2 size={16} />}
          </div>
        ) : thumbUrl ? (
          <BlurUp className="w-full h-full"><img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" /></BlurUp>
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
    </motion.div>
  );

  if (!swipeable) return row;
  return (
    <div className="relative rounded-xl overflow-hidden">
      {onSwipeFavorite && (
        <div className="absolute inset-0 flex items-center justify-start pl-5 bg-[#8e9aaf]">
          <motion.span style={{ opacity: favOpacity, scale: favScale }} className="text-[#121212] flex items-center gap-1.5 text-xs font-bold"><Heart size={20} fill={song.favorite ? 'none' : 'currentColor'} /> {song.favorite ? 'Quitar' : 'Favorita'}</motion.span>
        </div>
      )}
      {onSwipeDelete && (
        <div className="absolute inset-0 flex items-center justify-end pr-5 bg-red-500">
          <motion.span style={{ opacity: delOpacity, scale: delScale }} className="text-white flex items-center gap-1.5 text-xs font-bold">Eliminar <Trash2 size={20} /></motion.span>
        </div>
      )}
      {row}
    </div>
  );
}
