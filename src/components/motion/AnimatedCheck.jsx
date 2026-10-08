import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

// Check que se "dibuja" con trazo SVG: primero el círculo, después la tilde.
export default function AnimatedCheck({ size = 22, className = '', circle = true, strokeWidth = 2.2 }) {
  return (
    <motion.svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {circle && (
        <motion.circle cx="12" cy="12" r="10" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 0.5, ease: EASE_OUT }} />
      )}
      <motion.path d="M7.5 12.6l3 3 6-6.6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: circle ? 0.25 : 0 }} />
    </motion.svg>
  );
}
