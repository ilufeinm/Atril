import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

// Mockup animado en CSS que simula el Modo En Vivo: una partitura (lead sheet)
// que cambia de página con una transición de desplazamiento, un indicador de
// página y controles minimizados. Sin archivos externos, carga instantánea.
export default function LivePreviewMock() {
  return (
    <div className="relative mx-auto w-full max-w-[280px] aspect-[3/4.2] rounded-[20px] bg-black overflow-hidden border border-white/10 shadow-2xl">
      {/* Glow superior */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 18%, rgba(142,154,175,.16), transparent 60%)' }} />

      {/* Hoja de partitura que se desliza */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="live-mock-pages w-full h-full">
          {[0, 1, 2].map((i) => (
            <div key={i} className="live-mock-page w-full h-full bg-[#fffdf7] flex flex-col items-center justify-start px-5 pt-5 pb-3">
              <div className="text-[7px] tracking-[.25em] text-[#8b8b84] font-semibold mb-2">SCOREBOOK · PARTITURA</div>
              <div className="text-[13px] font-bold text-[#222329] leading-tight">{['Autumn Leaves', 'Blue Bossa', 'All of Me'][i]}</div>
              <div className="text-[7px] text-[#777970] mt-1 mb-3">{['Johnny Mercer', 'Kenny Dorham', 'Seymour Simons'][i]}</div>
              <div className="w-full border-y border-[#ddddd5] py-1 flex justify-between text-[6px] text-[#787a70] font-bold tracking-widest uppercase mb-3">
                <span>♩ = 120</span><span>4/4</span><span>{['Em', 'Cm', 'C'][i]}</span>
              </div>
              {/* Líneas de acordes simuladas */}
              {[0, 1, 2, 3, 4].map((r) => (
                <div key={r} className="w-full flex items-center gap-1.5 mb-2">
                  <span className="text-[6px] font-mono font-semibold text-[#303c22] bg-[#303c22]/8 rounded px-1 py-0.5 min-w-[18px] text-center">{['Em7', 'A7', 'Dm7', 'G7', 'Cmaj7'][r]}</span>
                  <div className="flex-1 h-px bg-[#cfcfc8]" />
                </div>
              ))}
              <div className="mt-auto text-[6px] text-[#aaa99f]">{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de página */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {[0, 1, 2].map((i) => (
          <span key={i} className="live-mock-dot w-1.5 h-1.5 rounded-full bg-white/30" />
        ))}
      </div>

      {/* Controles minimizados */}
      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1">
        <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70"><ChevronLeft size={12} /></span>
        <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70"><ChevronRight size={12} /></span>
      </div>

      {/* Badge REC simulado */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 text-[7px] font-semibold text-red-300 bg-black/40 backdrop-blur rounded-full px-1.5 h-4">
        <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> REC
      </div>

      {/* Botón play flotante */}
      <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-[#8e9aaf] flex items-center justify-center text-[#121212]">
        <Play size={12} fill="currentColor" />
      </div>
    </div>
  );
}