import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SPRING_BOUNCY } from '@/lib/motion';

const ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

// Barra A–Z: se puede tocar o arrastrar el dedo por encima. Una burbuja con la letra
// activa acompaña al dedo (como en Contactos) y vibra levemente al cambiar de letra.
export default function AlphabetBar({ letters, onJump }) {
  const ref = useRef(null);
  const lastLetter = useRef(null);
  const [active, setActive] = useState(null); // { letter, y }
  if (!letters || letters.length < 2) return null;
  const set = new Set(letters);

  const pick = (clientY) => {
    const r = ref.current.getBoundingClientRect();
    const rel = Math.min(Math.max((clientY - r.top) / r.height, 0), 0.999);
    let i = Math.floor(rel * ALL.length);
    // Si la letra no tiene canciones, salta a la más cercana que sí.
    let best = null;
    for (let d = 0; d < ALL.length && !best; d++) {
      if (set.has(ALL[i - d])) best = ALL[i - d];
      else if (set.has(ALL[i + d])) best = ALL[i + d];
    }
    if (!best) return;
    const idx = ALL.indexOf(best);
    const y = r.top + (idx + 0.5) * (r.height / ALL.length);
    setActive({ letter: best, y });
    if (best !== lastLetter.current) {
      lastLetter.current = best;
      navigator.vibrate?.(6);
      onJump(best);
    }
  };
  const end = () => { setActive(null); lastLetter.current = null; };

  return (
    <>
      <div
        ref={ref}
        data-sheet-hide
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientY); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') pick(e.clientY); }}
        onPointerUp={end}
        onPointerCancel={end}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center select-none touch-none py-1 pl-2 pr-1 rounded-full"
      >
        {ALL.map((l) => (
          <span key={l} className={`text-[9px] font-bold w-5 h-3 flex items-center justify-center transition-colors ${set.has(l) ? (active?.letter === l ? 'text-white' : 'text-[#8e9aaf]') : 'text-white/15'}`}>{l}</span>
        ))}
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            key="bubble"
            data-sheet-hide
            initial={{ opacity: 0, scale: 0.5, x: 14 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 10, transition: { duration: 0.15 } }}
            transition={SPRING_BOUNCY}
            style={{ top: active.y, y: '-50%' }}
            className="fixed right-12 z-30 pointer-events-none w-14 h-14 rounded-full rounded-br-sm bg-[#8e9aaf] text-[#121212] text-2xl font-bold flex items-center justify-center shadow-xl shadow-black/40"
          >
            {active.letter}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
