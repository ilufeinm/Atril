import React, { useState } from 'react';
import { ArrowLeft, Play, Pencil, Highlighter, Type, ArrowRight, Square, Eraser, Hand, Undo2, Redo2, Trash2, Minus, Plus } from 'lucide-react';
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

  const stored = (() => { try { return JSON.parse(song?.annotations || '[]'); } catch { return []; } })();
  const items = history ?? stored;

  const persist = (next) => { setHistory(next); onSaveAnnotations(JSON.stringify(next)); };
  const change = (next) => { setFuture([]); persist(next); };
  const undo = () => { if (!items.length) return; setFuture([...future, items.at(-1)]); persist(items.slice(0, -1)); };
  const redo = () => { if (!future.length) return; persist([...items, future.at(-1)]); setFuture(future.slice(0, -1)); };
  const clearPage = () => { if (!items.length) return; change(items.filter((x) => x.page && x.page !== page)); };

  const pageItems = items.filter((x) => !x.page || x.page === page);
  const maxPage = song?.pages || 1;

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between px-3 h-14 shrink-0">
        <button onClick={onBack} className="h-10 px-3 rounded-xl bg-white/10 text-white text-sm font-semibold flex items-center gap-2"><ArrowLeft size={17} /> Volver</button>
        <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Editar partitura</span>
        <button onClick={onPerform} className="h-10 px-4 rounded-xl stage-grad text-white text-sm font-bold flex items-center gap-2"><Play size={16} /> Presentación</button>
      </div>

      <div className="flex-1 overflow-auto flex justify-center">
        <div className="relative w-full max-w-[760px] my-4" style={{ zoom }}>
          <ScorePreview song={song} page={page} />
          <AnnotationLayer
            items={pageItems}
            onChange={(next) => change([...items.filter((x) => x.page && x.page !== page), ...next.map((x) => ({ ...x, page }))])}
            tool={tool}
            color={color}
            enabled={tool !== 'mover'}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 h-10 text-white/50 text-sm shrink-0">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 disabled:opacity-30" aria-label="Página anterior">‹</button>
        <span className="text-xs">{page} / {maxPage}</span>
        <button onClick={() => onPageChange(Math.min(maxPage, page + 1))} disabled={page >= maxPage} className="p-1.5 disabled:opacity-30" aria-label="Página siguiente">›</button>
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div className="bg-[#161B26] border border-white/10 rounded-2xl p-2 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tools.map((t) => (
            <button key={t.id} title={t.label} aria-label={t.label} onClick={() => setTool(t.id)} className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition ${tool === t.id ? 'stage-grad text-white' : 'text-white/55 hover:bg-white/10'}`}><t.icon size={18} /></button>
          ))}
          <div className="w-px h-7 bg-white/10 mx-1 shrink-0" />
          <label title="Color" aria-label="Color" className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center cursor-pointer">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 bg-transparent cursor-pointer" />
          </label>
          <div className="w-px h-7 bg-white/10 mx-1 shrink-0" />
          <button title="Deshacer" aria-label="Deshacer" onClick={undo} disabled={!items.length} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/55 hover:bg-white/10 disabled:opacity-30"><Undo2 size={18} /></button>
          <button title="Rehacer" aria-label="Rehacer" onClick={redo} disabled={!future.length} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/55 hover:bg-white/10 disabled:opacity-30"><Redo2 size={18} /></button>
          <button title="Limpiar página" aria-label="Limpiar página" onClick={clearPage} disabled={!pageItems.length} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-red-300/80 hover:bg-red-500/15 disabled:opacity-30"><Trash2 size={18} /></button>
          <div className="w-px h-7 bg-white/10 mx-1 shrink-0" />
          <button title="Alejar" aria-label="Alejar" onClick={() => setZoom(Math.max(.6, +(zoom - .2).toFixed(1)))} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/55 hover:bg-white/10"><Minus size={18} /></button>
          <span className="text-white/40 text-xs w-10 text-center shrink-0">{Math.round(zoom * 100)}%</span>
          <button title="Acercar" aria-label="Acercar" onClick={() => setZoom(Math.min(2, +(zoom + .2).toFixed(1)))} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/55 hover:bg-white/10"><Plus size={18} /></button>
        </div>
      </div>
    </div>
  );
}