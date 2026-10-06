import React, { useState, useEffect, useRef } from 'react';
import { resolvePage, needsConversion, pageUriList } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';
import { usePagePreload, getPreloadedDimensions } from '@/hooks/usePagePreload';

// Rectángulo real que ocupa una imagen con object-contain dentro de cw×ch.
const containRect = (cw, ch, nw, nh) => {
  if (!nw || !nh || !cw || !ch) return null;
  const scale = Math.min(cw / nw, ch / nh);
  const w = nw * scale, h = nh * scale;
  return { left: (cw - w) / 2, top: (ch - h) / 2, width: w, height: h };
};

export default function ScorePreview({ song, page = 1, zoom = 1, fill = false, onContentRect, conversionProgress }) {
  const lines = (song?.content || `[${song?.key || 'Sol'}]  Cada nota nos lleva a algún lugar\n\n[Do]  En el silencio empieza la canción\n[Lam]  Dejamos que nos guíe el corazón\n[Fa]  Y cuando el escenario cobre vida\n[Sol]  Volvemos a empezar\n\nESTRIBILLO\n[Do]  Que suene fuerte esta noche\n[Sol]  Hasta el último compás\n[Lam]  Que el tiempo se detenga\n[Fa]  Y volvamos a cantar`).split('\n');

  const rootRef = useRef(null);
  const textRef = useRef(null);
  const lastRectRef = useRef(null);
  const [textScale, setTextScale] = useState(1);
  const [natural, setNatural] = useState(null);

  const reportRect = (rect) => {
    const last = lastRectRef.current;
    if (last && rect && last.left === rect.left && last.top === rect.top && last.width === rect.width && last.height === rect.height) return;
    lastRectRef.current = rect;
    onContentRect?.(rect);
  };

  const resolved = resolvePage(song, page);
  const isImg = resolved.kind === 'image';
  const isText = resolved.kind === 'text';
  const mustConvert = needsConversion(song);
  const imgSrc = isImg ? resolved.src : null;
  const signedSrc = useSignedUrl(imgSrc);

  // Pre cargar páginas adyacentes (N-1, N+1) y medir dimensiones solo al cargar.
  const uris = pageUriList(song);
  usePagePreload(uris, page);

  useEffect(() => {
    if (!isImg) { setNatural(null); return; }
    const cached = getPreloadedDimensions(imgSrc);
    if (cached) { setNatural(cached); return; }
    let cancelled = false;
    const img = new globalThis.Image();
    img.onload = () => { if (!cancelled) setNatural({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.src = signedSrc;
    return () => { cancelled = true; img.onload = null; };
  }, [signedSrc, isImg, imgSrc]);

  // Ajuste de texto en Modo En Vivo
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
  }, [fill, song?.id]);

  // Reporta el rectángulo real de la partitura (relativo a la raíz).
  useEffect(() => {
    if (!onContentRect || !rootRef.current) return;
    const root = rootRef.current;
    const report = () => {
      const r = root.getBoundingClientRect();
      let rect = null;
      if (isImg && natural) {
        rect = containRect(r.width, r.height, natural.w, natural.h) || { left: 0, top: 0, width: r.width, height: r.height };
      } else if (textRef.current) {
        const tb = textRef.current.getBoundingClientRect();
        rect = { left: tb.left - r.left, top: tb.top - r.top, width: tb.width, height: tb.height };
      } else {
        rect = { left: 0, top: 0, width: r.width, height: r.height };
      }
      reportRect(rect);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(root);
    return () => ro.disconnect();
  }, [onContentRect, isImg, natural, textScale, fill]);

  const root = fill
    ? 'relative night-target bg-[#fffdf7] text-[#222329] mx-auto w-full h-full overflow-hidden flex items-center justify-center'
    : 'relative night-target bg-[#fffdf7] text-[#222329] shadow-[0_25px_80px_rgba(0,0,0,.35)] rounded-[3px] mx-auto w-full max-w-[760px] min-h-[600px] overflow-hidden';

  const converting = mustConvert && conversionProgress;

  return (
    <div ref={rootRef} className={root} style={{ fontSize: `${zoom}em` }}>
      {mustConvert ? (
        <div className="flex flex-col items-center justify-center w-full h-full text-center px-6 bg-[#fffdf7] text-[#5a5a52]">
          <div className="text-[10px] tracking-[.25em] text-[#8b8b84] font-semibold mb-4">PREPARANDO PARTITURA</div>
          {converting && conversionProgress.total > 0 ? (
            <>
              <div className="w-40 h-1.5 rounded-full bg-[#e5e5dd] overflow-hidden mb-3">
                <div className="h-full bg-[#8e9aaf] transition-all" style={{ width: `${Math.round((conversionProgress.done / conversionProgress.total) * 100)}%` }} />
              </div>
              <div className="text-xs text-[#787a70]">{conversionProgress.done} / {conversionProgress.total} páginas</div>
            </>
          ) : (
            <div className="w-6 h-6 border-2 border-[#ccc8b8] border-t-[#8e9aaf] rounded-full animate-spin mb-3" />
          )}
          <div className="text-xs text-[#aaa99f] mt-1">Optimizando para el escenario…</div>
        </div>
      ) : isImg ? (
        <img
          src={signedSrc}
          alt={`Partitura de ${song?.title || ''}`}
          decoding="async"
          className={fill ? 'w-full h-full object-contain' : 'w-full h-auto'}
        />
      ) : isText ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full text-center px-6 text-[#aaa99f]">
          <div className="text-sm">Partitura no disponible en este modo.</div>
          <div className="text-xs text-[#aaa99f] mt-1">Abrila desde el Modo En Vivo para optimizarla.</div>
        </div>
      )}
    </div>
  );
}