import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MoreHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cardMotion, SPRING_POP } from '@/lib/motion';
import { heroIn } from '@/lib/hero';
import HighlightText from './HighlightText';
import ScorePaper, { songThumbUri } from './ScorePaper';
import useSignedUrl from '@/hooks/useSignedUrl';
import { tr } from '@/i18n';

// Partitura en la grilla (v3, Fase 3): la página real como protagonista, debajo el tema y "tono · BPM", y "⋯".
// offline: tilde lima abajo a la izquierda si ya está completa en el teléfono.
export default function SongCard({ song, query, selectionMode, selected, onToggleSelect, onLongPress, onMore, offline, index = 0 }) {
  const nav = useNavigate();
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const thumbRef = useRef(null);
  const signedSrc = useSignedUrl(songThumbUri(song));
  const meta = [song.key, song.bpm].filter(Boolean).join(' · ');

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
    if (signedSrc) heroIn(song.id, thumbRef.current, signedSrc);
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
      role="button"
      tabIndex={0}
      aria-label={song.title}
      className="relative min-w-0 flex flex-col gap-2 cursor-pointer select-none"
    >
      <ScorePaper
        ref={thumbRef}
        data-hero-id={song.id}
        song={song}
        titleSize="text-[10px]"
        className={`w-full aspect-[3/4] !rounded-[6px] score-card ${selectionMode && selected ? 'ring-2 ring-[#8F98E3]' : ''}`}
      >
        {offline && !selectionMode && (
          <span role="img" aria-label={tr('Disponible sin conexión')} className="absolute left-1.5 bottom-1.5 w-5 h-5 rounded-full bg-[#111113]/80 flex items-center justify-center">
            <Check size={11} strokeWidth={3.2} className="text-[#C9EF72]" aria-hidden="true" />
          </span>
        )}
        {song.is_demo && !selectionMode && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/60 text-white/80">{tr('Demo')}</span>}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              key="sel"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={SPRING_POP}
              className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${selected ? 'bg-[#8F98E3]' : 'bg-black/50'}`}
            >
              {selected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_POP} className="flex">
                  <Check size={14} className="text-[#111113]" />
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScorePaper>
      <div className="flex items-start gap-0.5 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate"><HighlightText text={song.title} query={query} /></div>
          <div className="text-xs text-white/60 truncate tabular-nums mt-0.5">{meta || <HighlightText text={song.artist || tr('Artista desconocido')} query={query} />}</div>
        </div>
        {!selectionMode && (
          <button
            type="button"
            aria-label={tr('Más opciones de {{title}}', { title: song.title })}
            onClick={(e) => { e.stopPropagation(); (onMore || onLongPress)?.(song); }}
            onTouchStart={(e) => e.stopPropagation()}
            className="press-none -mt-2 -mr-2 w-8 h-10 shrink-0 flex items-center justify-center rounded-full text-white/70 hover:text-white"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
