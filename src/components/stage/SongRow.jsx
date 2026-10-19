import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Check, Star, MoreHorizontal } from 'lucide-react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import { EASE_OUT, SPRING, SPRING_POP, itemDelay } from '@/lib/motion';
import { heroIn } from '@/lib/hero';
import ScorePaper, { songThumbUri } from './ScorePaper';
import HighlightText from './HighlightText';
import useSignedUrl from '@/hooks/useSignedUrl';
import { tr } from '@/i18n';

// Columnas de la fila (v3): miniatura · tema · tono · BPM · sin conexión · ⋯. El encabezado usa las mismas.
const COLS = 'grid grid-cols-[30px_minmax(0,1fr)_36px_34px_14px_40px] gap-x-2.5 items-center';

// Encabezado de la tabla de partituras (va una vez, arriba de la lista).
export function SongTableHeader({ className = '' }) {
  return (
    <div aria-hidden="true" className={`table-head ${COLS} pb-2 pt-1 text-[10px] font-semibold tracking-[.09em] uppercase ${className}`}>
      <span /><span>{tr('Tema')}</span><span>{tr('Tono')}</span><span className="text-right">{tr('BPM')}</span><span /><span />
    </div>
  );
}

// offline: la partitura ya está completa en el teléfono (tilde lima). onMore: el botón ⋯ (si no, abre lo mismo que mantener apretado).
export default function SongRow({ song, query, selectionMode, selected, onToggleSelect, onLongPress, onMore, offline, compact, index = 0, onSwipeFavorite, onSwipeDelete }) {
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
  // Los fondos de deslizar solo se ven mientras la fila se mueve (si no, asoman durante la animación de entrada).
  const favLayer = useTransform(x, (v) => (v > 0 ? 1 : 0));
  const delLayer = useTransform(x, (v) => (v < 0 ? 1 : 0));

  const thumbUrl = useSignedUrl(songThumbUri(song));

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
      initial={index > 20 ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE_OUT, delay: itemDelay(index, 0.03) } }}
      whileTap={{ scale: 0.985, transition: SPRING }}
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => { if (!selectionMode) { e.preventDefault(); onLongPress?.(song); } }}
      role="button"
      tabIndex={0}
      // relative z-[1]: la fila queda por delante de las capas de deslizar (Favorita / Eliminar).
      className={`press-none group relative z-[1] ${COLS} h-14 transition-colors duration-200 min-w-0 cursor-pointer select-none ${selectionMode && selected ? 'bg-[#8F98E3]/10 border-b border-[#8F98E3]/30' : 'row-line'}`}
    >
      <ScorePaper ref={thumbRef} data-hero-id={song.id} song={song} className="w-[30px] h-10 shadow-[0_2px_6px_rgba(0,0,0,.35)]">
        {selectionMode && (
          <div className={`absolute inset-0 flex items-center justify-center ${selected ? 'bg-[#8F98E3] text-[#111113]' : 'bg-[#fffdf7]/80 text-[#222329]/45'}`}>
            {selected ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_POP} className="flex"><Check size={16} /></motion.span> : <Music2 size={14} />}
          </div>
        )}
      </ScorePaper>
      <div className="min-w-0">
        <div className="font-semibold text-[15px] flex items-center gap-1.5 min-w-0">
          <span className="truncate"><HighlightText text={song.title} query={query} /></span>
          {song.favorite && <Star size={12} fill="currentColor" className="lime-text shrink-0" aria-label={tr('Favorita')} />}
          {song.is_demo && <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-white/10 text-white/55">{tr('Demo')}</span>}
        </div>
        <div className="text-xs text-white/60 truncate mt-0.5">
          <HighlightText text={song.artist || tr('Artista desconocido')} query={query} />
        </div>
      </div>
      <span className="text-[13px] font-semibold truncate">{compact ? '' : (song.key || <span className="text-white/30">—</span>)}</span>
      <span className="text-[13px] text-white/75 text-right tabular-nums">{compact ? '' : (song.bpm || <span className="text-white/30">—</span>)}</span>
      <span className="flex justify-center">
        {offline && <Check size={13} strokeWidth={3} className="lime-text" aria-label={tr('Disponible sin conexión')} />}
      </span>
      {selectionMode ? <span /> : (
        <button
          type="button"
          aria-label={tr('Más opciones de {{title}}', { title: song.title })}
          onClick={(e) => { e.stopPropagation(); (onMore || onLongPress)?.(song); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="press-none w-10 h-11 justify-self-end rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[.06]"
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    </motion.div>
  );

  if (!swipeable) return row;
  return (
    <div className="relative overflow-hidden">
      {onSwipeFavorite && (
        <motion.div style={{ opacity: favLayer }} className="absolute inset-0 flex items-center justify-start pl-5 bg-[#8e9aaf]">
          <motion.span style={{ opacity: favOpacity, scale: favScale }} className="text-[#121212] flex items-center gap-1.5 text-xs font-bold"><Heart size={20} fill={song.favorite ? 'none' : 'currentColor'} /> {song.favorite ? tr('Quitar') : tr('Favorita')}</motion.span>
        </motion.div>
      )}
      {onSwipeDelete && (
        <motion.div style={{ opacity: delLayer }} className="absolute inset-0 flex items-center justify-end pr-5 bg-red-500">
          <motion.span style={{ opacity: delOpacity, scale: delScale }} className="text-white flex items-center gap-1.5 text-xs font-bold">{tr('Eliminar')}{' '}<Trash2 size={20} /></motion.span>
        </motion.div>
      )}
      {row}
    </div>
  );
}
