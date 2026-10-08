import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Título grande estilo iOS: al hacer scroll se achica y se desvanece mientras aparece
// una barra compacta con desenfoque arriba (solo en móvil; en escritorio ya existe el header).
export default function LargeTitle({ children, className = 'text-3xl font-bold tracking-tight' }) {
  const { scrollY } = useScroll();
  const titleOpacity = useTransform(scrollY, [20, 80], [1, 0]);
  const titleScale = useTransform(scrollY, [0, 80], [1, 0.9]);
  const barOpacity = useTransform(scrollY, [50, 100], [0, 1]);
  const barY = useTransform(scrollY, [50, 100], [-6, 0]);

  return (
    <>
      <motion.h1 className={`${className} origin-left`} style={{ opacity: titleOpacity, scale: titleScale }}>{children}</motion.h1>
      <motion.div
        aria-hidden
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-end justify-center h-[calc(48px+env(safe-area-inset-top))] pb-3 bg-[#121212]/80 backdrop-blur-xl border-b border-[#2b2b30] pointer-events-none"
        style={{ opacity: barOpacity, y: barY }}
      >
        <span className="font-semibold text-[15px] truncate max-w-[70%]">{children}</span>
      </motion.div>
    </>
  );
}
