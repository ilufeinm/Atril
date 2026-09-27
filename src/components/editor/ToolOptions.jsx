import React from 'react';
import { SWATCHES, GROSOR_PRESETS, OPAC_PRESETS, TEXT_SIZES, TEXT_STYLES, MARKER_LABELS } from './editorTools';

export default function ToolOptions({ tool, options, setOpt }) {
  const o = options[tool] || {};
  if (!['lapiz', 'resaltador', 'texto', 'flecha', 'forma', 'marcador'].includes(tool)) return null;

  const wrap = (children) => (
    <div className="absolute left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[600px]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 70px)' }}>
      <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-full px-3 h-11 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>{children}</div>
    </div>
  );
  const colors = (active) => SWATCHES.map((c) => (
    <button key={c} onClick={() => setOpt({ color: c })} className={`shrink-0 w-6 h-6 rounded-full border-2 ${active === c ? 'border-white' : 'border-white/20'}`} style={{ background: c }} aria-label={`Color ${c}`} />
  ));
  const grosor = (active, dim) => GROSOR_PRESETS.map((g) => (
    <button key={g} onClick={() => setOpt({ grosor: g })} className={`shrink-0 h-7 w-8 rounded-full flex items-center justify-center ${active === g ? 'bg-white/20' : 'bg-white/5'}`} aria-label={`Grosor ${g}`}>
      <span className="block rounded-full" style={{ width: g * 1.2, height: g * 1.2, background: dim ? 'rgba(255,255,255,.8)' : '#fff' }} />
    </button>
  ));

  if (tool === 'lapiz' || tool === 'flecha' || tool === 'forma') {
    return wrap(<>{colors(o.color)}<div className="w-px h-6 bg-white/10" />{grosor(o.grosor)}</>);
  }
  if (tool === 'resaltador') {
    return wrap(<>{colors(o.color)}<div className="w-px h-6 bg-white/10" />{grosor(o.grosor, true)}<div className="w-px h-6 bg-white/10" />{OPAC_PRESETS.map((op) => (
      <button key={op} onClick={() => setOpt({ opacidad: op })} className={`shrink-0 px-2 h-6 rounded-full text-[10px] text-white/80 ${o.opacidad === op ? 'bg-white/20' : 'bg-white/5'}`}>{Math.round(op * 100)}%</button>
    ))}</>);
  }
  if (tool === 'texto') {
    return wrap(<>{TEXT_SIZES.map((s) => (
      <button key={s} onClick={() => setOpt({ size: s })} className={`shrink-0 px-2 h-7 rounded-full text-white/85 text-[11px] ${o.size === s ? 'bg-white/20' : 'bg-white/5'}`}>{s}</button>
    ))}<div className="w-px h-6 bg-white/10" />{TEXT_STYLES.map((st) => (
      <button key={st.id} onClick={() => setOpt({ style: st.id })} className={`shrink-0 w-7 h-7 rounded-full text-white/85 text-xs font-bold ${o.style === st.id ? 'bg-white/20' : 'bg-white/5'} ${st.id === 'italic' ? 'italic' : ''} ${st.id === 'bold' ? 'font-extrabold' : ''}`}>{st.label}</button>
    ))}<div className="w-px h-6 bg-white/10" />{colors(o.color)}</>);
  }
  if (tool === 'marcador') {
    return wrap(<>{MARKER_LABELS.map((l) => (
      <button key={l} onClick={() => setOpt({ label: l })} className={`shrink-0 px-3 h-7 rounded-full text-[11px] font-bold ${o.label === l ? 'stage-grad text-white' : 'bg-white/10 text-white/70'}`}>{l}</button>
    ))}</>);
  }
  return null;
}