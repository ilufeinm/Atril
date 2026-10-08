import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { SHEET_SPRING } from '@/lib/motion';
import { setSheetOpen } from '@/lib/sheet';

// Hoja inferior con alturas intermedias (detents), estilo iOS:
//  · se abre a media pantalla, se arrastra hasta pantalla completa y se cierra hacia abajo;
//  · la página de atrás se achica levemente mientras está abierta;
//  · en pantallas anchas (≥640px) se comporta como un modal centrado.
// `detents`: alturas visibles como fracción de la pantalla (p. ej. [0.55, 0.94]). `initial`: índice de apertura.
export default function BottomSheet({ onClose, title, children, detents = [0.55, 0.94], initial = 0 }) {
  const [wide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);
  return createPortal(
    wide
      ? <Modal onClose={onClose} title={title}>{children}</Modal>
      : <Sheet onClose={onClose} title={title} detents={detents} initial={initial}>{children}</Sheet>,
    document.body,
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="anim-backdrop fixed inset-0 z-[205] bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#292d36] text-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-white/50"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}

function Sheet({ onClose, title, children, detents, initial }) {
  const vh = window.innerHeight;
  const H = Math.round(vh * Math.max(...detents));
  const stops = detents.map((d) => H - Math.round(vh * d)).sort((a, b) => a - b); // y=0 → abierta del todo
  const y = useMotionValue(H);
  const backdrop = useTransform(y, [0, H], [1, 0]);
  const controls = useDragControls();

  useEffect(() => {
    setSheetOpen(true);
    const c = animate(y, H - Math.round(vh * (detents[initial] ?? detents[0])), SHEET_SPRING);
    return () => { c.stop(); setSheetOpen(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => animate(y, H, { ...SHEET_SPRING, onComplete: onClose });
  const onDragEnd = (_, info) => {
    const projected = y.get() + info.velocity.y * 0.25;
    const target = [...stops, H].reduce((best, s) => (Math.abs(s - projected) < Math.abs(best - projected) ? s : best), stops[0]);
    if (target === H) close(); else animate(y, target, SHEET_SPRING);
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[205] bg-black/60" style={{ opacity: backdrop }} onClick={close} />
      <motion.div
        role="dialog"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[210] flex flex-col bg-[#292d36] text-white rounded-t-[28px] shadow-2xl"
        style={{ y, height: H }}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: H }}
        dragElastic={{ top: 0.05, bottom: 0.2 }}
        onDragEnd={onDragEnd}
      >
        <div className="shrink-0 touch-none cursor-grab select-none" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h3 className="text-base font-bold">{title}</h3>
            <button onClick={close} onPointerDown={(e) => e.stopPropagation()} aria-label="Cerrar" className="p-1 text-white/50"><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">{children}</div>
      </motion.div>
    </>
  );
}
