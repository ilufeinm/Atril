import React, { useState, useEffect, useRef } from 'react';
import { Image } from '@/components/ui/image';

// Calcula el rectángulo real que ocupa una imagen con object-contain dentro de
// un contenedor de tamaño cw×ch, a partir de sus dimensiones naturales.
const containRect = (cw, ch, nw, nh) => {
  if (!nw || !nh || !cw || !ch) return null;
  const scale = Math.min(cw / nw, ch / nh);
  const w = nw * scale, h = nh * scale;
  return { left: (cw - w) / 2, top: (ch - h) / 2, width: w, height: h };
};

export default function ScorePreview({ song, page = 1, zoom = 1, fill = false, onContentRect }) {
  const lines = (song?.content || `[${song?.key || 'Sol'}]  Cada nota nos lleva a algún lugar\n\n[Do]  En el silencio empieza la canción\n[Lam]  Dejamos que nos guíe el corazón\n[Fa]  Y cuando el escenario cobre vida\n[Sol]  Volvemos a empezar\n\nESTRIBILLO\n[Do]  Que suene fuerte esta noche\n[Sol]  Hasta el último compás\n[Lam]  Que el tiempo se detenga\n[Fa]  Y volvamos a cantar`).split('\n');

  const rootRef = useRef(null);
  const textRef = useRef(null);
  const [textScale, setTextScale] = useState(1);
  const [natural, setNatural] = useState(null);

  const isPdf = !!song?.file_url && song.file_url.toLowerCase().includes('.pdf');
  const isImg = !!song?.file_url && !isPdf;

  // Carga las dimensiones naturales de la imagen para calcular el rectángulo
  // real que ocupa con object-contain (sin el letterbox del contenedor).
  useEffect(() => {
    if (!isImg) { setNatural(null); return; }
    let cancelled = false;
    const img = new globalThis.Image();
    img.onload = () => { if (!cancelled) setNatural({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.src = song.file_url;
    return () => { cancelled = true; img.onload = null; };
  }, [song?.file_url, isImg]);

  // En Modo En Vivo: escala el contenido de texto para que la hoja entera
  // quepa en el alto del viewport sin necesidad de desplazar.
  useEffect(() => {
    if (!fill || !textRef.current) return;
    const el = textRef.current;
    const parent = el.parentElement;
    const fit = () => {
      const ph = parent.clientHeight;
      const sh = el.scrollHeight;
      setTextScale(sh > ph ? Math.max(0.3, ph / sh) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [fill, song, page]);

  // Mide y reporta el rectángulo real donde se dibuja la partitura (relativo
  // a la raíz), para que la capa de anotaciones se alinee con la hoja y no con
  // el contenedor entero. Usa ResizeObserver para mantenerse sincronizado.
  useEffect(() => {
    if (!onContentRect || !rootRef.current) return;
    const root = rootRef.current;
    const report = () => {
      const r = root.getBoundingClientRect();
      let rect = null;
      if (isImg && natural) {
        rect = containRect(r.width, r.height, natural.w, natural.h) || { left: 0, top: 0, width: r.width, height: r.height };
      } else if (isPdf) {
        rect = { left: 0, top: 0, width: r.width, height: r.height };
      } else if (textRef.current) {
        const tb = textRef.current.getBoundingClientRect();
        rect = { left: tb.left - r.left, top: tb.top - r.top, width: tb.width, height: tb.height };
      } else {
        rect = { left: 0, top: 0, width: r.width, height: r.height };
      }
      onContentRect(rect);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(root);
    return () => ro.disconnect();
  }, [onContentRect, isImg, isPdf, natural, textScale, fill, song, page]);

  const root = fill
    ? 'relative bg-[#fffdf7] text-[#222329] mx-auto w-full h-full overflow-hidden flex items-center justify-center'
    : 'relative bg-[#fffdf7] text-[#222329] shadow-[0_25px_80px_rgba(0,0,0,.35)] rounded-[3px] mx-auto w-full max-w-[760px] min-h-[600px] overflow-hidden';

  return (
    <div ref={rootRef} className={root} style={{ fontSize: `${zoom}em` }}>
      {song?.file_url ? (
        isPdf ? (
          <iframe
            title="Partitura PDF"
            src={fill
              ? `${song.file_url}#page=${page}&view=FitH&toolbar=0&navpanes=0`
              : `${song.file_url}#page=${page}&toolbar=0`}
            className={fill ? 'w-full h-full' : 'w-full h-[75vh] min-h-[600px]'}
          />
        ) : (
          <Image
            src={song.file_url}
            alt={`Partitura de ${song.title}`}
            className={fill ? 'w-full h-full object-contain' : 'w-full h-auto'}
            fittingType="fit"
          />
        )
      ) : (
        <div
          ref={textRef}
          className={`px-[9%] py-[10%] ${fill ? 'w-full' : ''}`}
          style={fill ? { transform: `scale(${textScale})`, transformOrigin: 'top center' } : undefined}
        >
          <div className="text-center text-[.75em] tracking-[.25em] text-[#8b8b84] font-semibold mb-5">SCOREBOOK · PARTITURA</div>
          <h2 className="text-center text-[2.3em] font-bold tracking-tight leading-tight">{song?.title || 'Sin título'}</h2>
          <div className="text-center text-[.85em] text-[#777970] mt-2 mb-12">{song?.artist || 'Artista'} · {song?.key || 'Do'} mayor · {song?.bpm || 100} BPM</div>
          <div className="border-y border-[#ddddd5] py-3 flex justify-between text-[.7em] text-[#787a70] font-bold tracking-widest uppercase"><span>♩ = {song?.bpm || 100}</span><span>{song?.meter || '4/4'}</span><span>{song?.key || 'Do'}</span></div>
          <div className="mt-10 space-y-2 font-mono text-[.95em] leading-[1.8] whitespace-pre-wrap">
            {lines.map((line, i) => <div key={i} className={line === line.toUpperCase() && line.length > 4 ? 'font-sans font-bold text-[.8em] tracking-widest mt-8 mb-3 text-[#85877e]' : line.startsWith('[') ? 'text-[#303c22] font-semibold' : ''}>{line || '\u00a0'}</div>)}
          </div>
          <div className="text-center text-[#aaa99f] text-xs mt-20">{page}</div>
        </div>
      )}
    </div>
  );
}