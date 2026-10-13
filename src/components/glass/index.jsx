import React from 'react';

// Sistema visual "O" (Inicio, 2026-10-13): vidrio sobre un motivo musical de fondo, entradas (tickets) para
// lo que tiene fecha y bloques tipo bento. Los estilos viven en index.css (.glass, .glass-ticket, .glass-nav,
// .ticket-cut, .home-fade, .home-cta), con versión para modo claro y para "reducir transparencia".
// Regla: nada de vidrio en el Modo En Vivo ni en el visor (ahí manda la partitura).

const SCORE_LINES = 'M50 120H460M50 129H460M50 138H460M50 147H460M50 156H460M50 230H460M50 239H460M50 248H460M50 257H460M50 266H460M50 340H460M50 349H460M50 358H460M50 367H460M50 376H460M50 450H460M50 459H460M50 468H460M50 477H460M50 486H460';
const NOTES = [[100, 142], [180, 129], [260, 151], [340, 124], [420, 138], [130, 252], [220, 234], [310, 261], [400, 243], [150, 362], [280, 349]];
const WAVE = Array.from({ length: 64 }, (_, i) => {
  const h = 18 + Math.abs(Math.sin(i * 0.55) * 70 + Math.sin(i * 1.7) * 30);
  return `M${8 + i * 8} ${310 - h}V${310 + h}`;
}).join('');

// Fondo de una pantalla principal: un motivo inclinado que se funde con el fondo. Le da algo real al vidrio.
// motif: 'score' (partitura, Inicio y Partituras) · 'staves' (pentagramas, Bandas) · 'wave' (forma de onda, Grabaciones)
export function PageBackdrop({ motif = 'score', height = 620 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-4 -right-4 sm:-left-8 sm:-right-8 top-[calc(-1*(env(safe-area-inset-top)+1.5rem))] md:-top-6 overflow-hidden" style={{ height }}>
      <svg viewBox="0 0 510 620" preserveAspectRatio="xMidYMin slice" className="absolute -left-[8%] -top-12 w-[116%] h-[700px] -rotate-[8deg] opacity-45">
        {motif === 'wave' ? (
          <path d={WAVE} stroke="#fffdf7" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <>
            {motif === 'score' && <rect width="510" height="620" fill="#fffdf7" />}
            <path d={SCORE_LINES} stroke={motif === 'score' ? '#222329' : '#fffdf7'} strokeWidth="1.3" />
            {motif === 'score' && (
              <g fill="#222329">{NOTES.map(([cx, cy]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="7" ry="5" />)}</g>
            )}
          </>
        )}
      </svg>
      <div className="home-fade absolute inset-0" />
    </div>
  );
}

// Página de partitura en miniatura.
export const PaperThumb = ({ className = '' }) => (
  <svg viewBox="0 0 60 76" aria-hidden="true" className={className}>
    <rect width="60" height="76" rx="5" fill="#fffdf7" />
    <rect x="18" y="8" width="24" height="3" rx="1.5" fill="#222329" />
    <path d="M8 20H52M8 23H52M8 26H52M8 29H52M8 32H52M8 42H52M8 45H52M8 48H52M8 51H52M8 54H52" stroke="#222329" strokeWidth=".8" />
  </svg>
);

// Entrada (ticket) de vidrio con muescas a la altura del talón. El talón mide 76px (ver .ticket-cut).
export function Ticket({ children, stub, className = '' }) {
  return (
    <div className={`glass-ticket ticket-cut rounded-[26px] flex flex-col ${className}`}>
      <div className="flex-1 p-[18px] pb-3.5">{children}</div>
      <div className="mx-5 border-t-2 border-dashed border-white/10" />
      <div className="h-[76px] px-[18px] flex items-center gap-3">{stub}</div>
    </div>
  );
}

// Clase base de un bloque del bento (combinar con col-span-2, min-h-…, flex, etc.).
export const tile = 'glass rounded-3xl p-3.5 text-left';

// Fecha de una entrada: "dom 25 oct · 21:00" (se muestra en mayúsculas con CSS).
export function ticketDate(date, time) {
  if (!date) return 'Sin fecha';
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const day = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').replace(',', '');
  return time ? `${day} · ${time}` : day;
}

// "Hoy" · "Mañana" · "En 12 días" · "" (pasado o sin fecha). today = 'AAAA-MM-DD' local.
export function daysUntil(date, today) {
  if (!date) return '';
  const n = Math.round((new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  return n < 0 ? '' : n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `En ${n} días`;
}
