import React from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';

// Piezas comunes de la v3 (Fase 2, 2026-10-19). Sobrias: superficies sólidas, líneas finas, radios chicos.

// Control segmentado: una sola opción activa. options: [[valor, etiqueta, Ícono?], ...].
// size 'md' (32px por opción, para cambiar de sección) o 'sm' (28px, solo íconos: lista / grilla).
export function Segmented({ options, value, onChange, label, size = 'md', layoutId, className = '' }) {
  const h = size === 'sm' ? 'h-7' : 'h-8';
  return (
    <div role="tablist" aria-label={label} className={`seg-track inline-flex p-[3px] rounded-[11px] ${className}`}>
      {options.map(([key, text, Icon]) => {
        const on = key === value;
        const iconOnly = !!Icon && size === 'sm';
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={iconOnly ? text : undefined}
            onClick={() => !on && onChange(key)}
            className={`press-none relative flex-1 ${h} ${iconOnly ? 'w-[34px]' : 'px-4'} rounded-[8px] text-[13px] flex items-center justify-center gap-1.5 select-none transition-colors ${on ? 'font-semibold text-white' : 'font-medium text-white/65 hover:text-white'}`}
          >
            {on && (layoutId
              ? <motion.span layoutId={layoutId} className="seg-thumb absolute inset-0 rounded-[8px]" transition={SPRING} />
              : <span className="seg-thumb absolute inset-0 rounded-[8px]" />)}
            {Icon && <Icon size={15} className="relative" aria-hidden="true" />}
            {!iconOnly && <span className="relative whitespace-nowrap">{text}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Chip rectangular para filtros (carpetas, favoritas). active = elegido.
export function Chip({ active, onClick, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] transition-colors ${active ? 'chip-on font-semibold' : 'chip-off font-medium text-white/75 hover:text-white'} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Botones de la v3: 44px de alto. primary = blanco (oscuro en modo claro); secondary = borde fino.
export const btnPrimary = 'home-cta h-11 px-4 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2';
export const btnSecondary = 'btn-line h-11 px-4 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2';

// Estado vacío o de error: ícono fino en un cuadrado, título, una línea y dos salidas.
// tone 'error' agrega role="alert". actions: elementos (botones o links) ya armados.
export function StatusState({ icon: Icon, title, text, actions, tone = 'empty', className = '' }) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`flex flex-col items-center text-center py-12 px-4 ${className}`}>
      {Icon && (
        <span aria-hidden="true" className="status-icon w-[52px] h-[52px] rounded-[14px] flex items-center justify-center">
          <Icon size={24} strokeWidth={1.6} className={tone === 'error' ? 'text-[#F69284]' : 'text-white/80'} />
        </span>
      )}
      <h2 className="font-display text-xl font-bold tracking-tight mt-[18px]">{title}</h2>
      {text && <p className="text-sm leading-relaxed text-white/65 mt-2 max-w-[290px]">{text}</p>}
      {actions && <div className="flex flex-wrap justify-center gap-2.5 mt-[22px]">{actions}</div>}
    </div>
  );
}
