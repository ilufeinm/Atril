import React, { forwardRef } from 'react';
import BlurUp from '@/components/motion/BlurUp';
import useSignedUrl from '@/hooks/useSignedUrl';
import { resolvePage } from '@/lib/songPages';

// Miniatura de una partitura (v3, Fase 2): la primera página real, recortada arriba (donde están el título
// y los primeros compases). Si todavía no hay imagen, un papel sobrio con el título, sin rayitas inventadas.
// El tamaño lo da className (p. ej. "w-[30px] h-10"). Usa thumb_url, o la primera página si es una imagen.
export function songThumbUri(song) {
  if (!song) return null;
  if (song.thumb_url) return song.thumb_url;
  const first = resolvePage(song, 1);
  return first.kind === 'image' ? first.src : null;
}

const ScorePaper = forwardRef(function ScorePaper({ song, className = '', titleSize = 'text-[6px]', children, ...rest }, ref) {
  const url = useSignedUrl(songThumbUri(song));
  return (
    <div ref={ref} className={`score-paper relative overflow-hidden rounded-[3px] bg-[#fffdf7] shrink-0 ${className}`} {...rest}>
      {url ? (
        <BlurUp className="w-full h-full"><img src={url} alt="" className="w-full h-full object-cover object-top" loading="lazy" decoding="async" /></BlurUp>
      ) : (
        <span aria-hidden="true" className={`absolute inset-x-[12%] top-[14%] text-center font-semibold leading-tight text-[#222329] line-clamp-3 ${titleSize}`}>{song?.title}</span>
      )}
      {children}
    </div>
  );
});

export default ScorePaper;
