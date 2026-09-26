import React, { useState } from 'react';
import { ArrowLeft, Play, Pencil, Highlighter, Type, ArrowRight, Square, Eraser, Hand, Undo2, Redo2, Trash2, Minus, Plus, ChevronDown } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import AnnotationLayer from '@/components/stage/AnnotationLayer';

const tools = [
  { id: 'lapiz', label: 'Lápiz', icon: Pencil },
  { id: 'resaltador', label: 'Resaltador', icon: Highlighter },
  { id: 'texto', label: 'Texto', icon: Type },
  { id: 'flecha', label: 'Flecha', icon: ArrowRight },
  { id: 'forma', label: 'Forma', icon: Square },
  { id: 'borrador', label: 'Borrar', icon: Eraser },
  { id: 'mover', label: 'Mover', icon: Hand },
];

export default function LiveEditor({ song, page, onPageChange, onSaveAnnotations, onPerform, onBack }) {
  const [tool, setTool] = useState('lapiz');
  const [color, setColor] = useState('#dc9050');
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState(null);
  const [future, setFuture] = useState([]);
  const [open, setOpen] = useState(false);

  const stored = (() => { try { return JSON.parse(song?.annotations || '[]'); } catch { return []; } })();
  const items = history ?? stored;

  const persist = (next) => { setHistory(next); onSaveAnnotations(JSON.stringify(next)); };
  const change = (next) => { setFuture([]); persist(next); };
  const undo = () => { if (!items.length) return; setFuture([...future, items.at(-1)]); persist(items.slice(0, -1)); };
  const redo = () => { if (!future.length) return; persist([...items, future.at(-1)]); setFuture(future.slice(0, -1)); };
  const clearPage = () => { if (!pageItems.length) return; change(items.filter((x) => x.page && x.page !== page)); };

  const pageItems = items.filter((x) => !x.page || x.page === page);
  const maxPage = song?.pages || 1;

  return (
    <div className="fixed inset-0 bg-black select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Hoja completa centrada, sin scroll */}
      <div className="absolute inset-0 overflow-hidden flex justify-center">
        <div className="w-full max-w-[900px] h-full relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
          <ScorePreview song={song} page={page} fill />
          <AnnotationLayer
            items={pageItems}
            onChange={(next) => change([...items.filter((x) => x.page && x.page !== page), ...next.map((x) => ({ ...x, page }))])}
            tool={tool}
            color={color}
            enabled={tool !== 'mover'}
          />
        </div>
      </div>

      {/* Barra superior translúcida */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 h-14" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <button onClick={onBack} className="h-10 px-3 rounded-xl bg-black/45 backdrop-blur-md text-white text-sm font-semibold flex items-center gap-2 border border-white/5"><ArrowLeft size={17} /> Volver</button>
        <button onClick={onPerform} className="h-10 px-4 rounded-xl stage-grad text-white text-sm font-bold flex items-center gap-2 shadow-lg"><Play size={16} /> Presentación</button>
      </div>

      {/* Indicador de página sutil (centro superior) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-white/55 text-xs h-14" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center disabled:opacity-30" aria-label="Página anterior">‹</button>
        <span className="tabular-nums">{page} / {maxPage}</span>
        <button onClick={() => onPageChange(Math.min(maxPage, page + 1))} disabled={page >= maxPage} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center disabled:opacity-30" aria-label="Página siguiente">›</button>
      </div>

      {/* Barra de herramientas flotante y colapsable */}
      {open ? (
        <div className="absolute left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-[560px]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tools.map((t) => (
              <button key={t.id} title={t.label} aria-label={t.label} onClick={() => setTool(t.id)} className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition ${tool === t.id ? 'stage-grad text-white' : 'text-white/60 hover:bg-white/10'}`}><t.icon size={17} /></button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-0.5 shrink-0" />
            <label title="Color" aria-label="Color" className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center cursor-pointer">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 bg-transparent cursor-pointer" />
            </label>
            <div className="w-px h-6 bg-white/10 mx-0.5 shrink-0" />
            <button title="Deshacer" aria-label="Deshacer" onClick={undo} disabled={!items.length} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 disabled:opacity-30"><Undo2 size={17} /></button>
            <button title="Rehacer" aria-label="Rehacer" onClick={redo} disabled={!future.length} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 disabled:opacity-30"><Redo2 size={17} /></button>
            <button title="Limpiar página" aria-label="Limpiar página" onClick={clearPage} disabled={!pageItems.length} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-red-300/80 hover:bg-red-500/15 disabled:opacity-30"><Trash2 size={17} /></button>
            <div className="w-px h-6 bg-white/10 mx-0.5 shrink-0" />
            <button title="Alejar" aria-label="Alejar" onClick={() => setZoom(Math.max(1, +(zoom - .2).toFixed(1)))} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10"><Minus size={17} /></button>
            <span className="text-white/45 text-[11px] w-9 text-center shrink-0 tabular-nums">{Math.round(zoom * 100)}%</span>
            <button title="Acercar" aria-label="Acercar" onClick={() => setZoom(Math.min(2, +(zoom + .2).toFixed(1)))} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10"><Plus size={17} /></button>
            <div className="w-px h-6 bg-white/10 mx-0.5 shrink-0" />
            <button title="Cerrar herramientas" aria-label="Cerrar herramientas" onClick={() => setOpen(false)} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10"><ChevronDown size={18} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} aria-label="Abrir herramientas" className="absolute left-1/2 -translate-x-1/2 z-30 w-12 h-12 rounded-full bg-black/55 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-lg" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
          <Pencil size={19} />
        </button>
      )}
    </div>
  );
}