import React from 'react';
import { Pencil, Highlighter, Type, ArrowRight, Square, Bookmark, Eraser, ZoomIn, ZoomOut } from 'lucide-react';

const TOOLS = [
  { id: 'lapiz', label: 'Lápiz', Icon: Pencil },
  { id: 'resaltador', label: 'Resaltador', Icon: Highlighter },
  { id: 'texto', label: 'Texto', Icon: Type },
  { id: 'flecha', label: 'Flecha', Icon: ArrowRight },
  { id: 'forma', label: 'Forma', Icon: Square },
  { id: 'marcador', label: 'Marcador', Icon: Bookmark },
  { id: 'borrador', label: 'Borrar', Icon: Eraser },
];

export default function EditorToolbar({ tool, setTool, zoom, onZoomIn, onZoomOut }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-[600px]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
      <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 flex items-center justify-between gap-0.5">
        {TOOLS.map((t) => (
          <button key={t.id} title={t.label} aria-label={t.label} onClick={() => setTool(t.id)}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition ${tool === t.id ? 'stage-grad text-white shadow-lg' : 'text-white/55 hover:text-white/90'}`}>
            <t.Icon size={18} />
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 shrink-0" />
        <button title="Alejar" aria-label="Alejar" onClick={onZoomOut} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white/90"><ZoomOut size={18} /></button>
        <span className="text-white/45 text-[10px] w-8 text-center shrink-0 tabular-nums">{Math.round(zoom * 100)}%</span>
        <button title="Acercar" aria-label="Acercar" onClick={onZoomIn} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white/90"><ZoomIn size={18} /></button>
      </div>
    </div>
  );
}