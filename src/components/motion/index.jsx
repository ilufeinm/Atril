import React, { useEffect } from 'react';
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

// Número que "cuenta" hasta su valor. Respeta prefers-reduced-motion.
export function CountUp({ value, duration = 0.9, className }) {
  const reduce = useReducedMotion();
  const target = Number(value);
  const valid = Number.isFinite(target);
  const mv = useMotionValue(reduce || !valid ? target : 0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (!valid) return undefined;
    if (reduce) { mv.set(target); return undefined; }
    const controls = animate(mv, target, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [target, valid, reduce, duration, mv]);

  if (!valid) return <span className={className}>{String(value ?? '')}</span>;
  return <motion.span className={className}>{rounded}</motion.span>;
}

// Aparece con fade + subida suave. Útil para bloques sueltos.
export function Reveal({ children, delay = 0, y = 14, className, ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export { default as AnimatedCheck } from './AnimatedCheck';
export { default as BlurUp } from './BlurUp';
export { default as HeroLayer } from './HeroLayer';
