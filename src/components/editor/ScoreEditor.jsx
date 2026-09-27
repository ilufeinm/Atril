import React, { useState, useMemo } from 'react';
import { ArrowLeft, Undo2, Redo2, Save, Check } from 'lucide-react';
import ScoreCanvas from './ScoreCanvas';
import EditorToolbar from './EditorToolbar';
import ToolOptions from './ToolOptions';
import { DEFAULTS, hitTest } from './editorTools';

export default function ScoreEditor({ song, page, onPageChange, onSaveAnnotations, onPerform, onBack }) {
  const [tool, setTool] = useState('lapiz');
  const [options, setOptions] = useState(DEFAULTS);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState(null);
  const [future, setFuture] = useState([]);
  const [saved, setSaved] = useState('idle');

  const stored = useMemo(() => { try { return JSON.parse(song?.annotations || '[]'); } catch { return []; } }, [song]);
  const items = history ?? stored;
  const maxPage = song?.pages || 1;

  const setOpt = (patch) => setOptions((o) => ({ ...o, [tool]: { ...o[tool], ...patch } }));

  const commit = (next) => { setHistory(next); setFuture([]); setSaved('idle'); };
  const add = (item) => commit([...items, { ...item, page }]);

  const eraseAt = (x, y) => {
    const pageItems = items.filter((it) => !it.page || it.page === page);
    const localIdx = hitTest(pageItems, x, y);
    if (localIdx < 0) return;
    const realIdx = items.indexOf(pageItems[localIdx]);
    commit(items.filter((_, n) => n !== realIdx));
  };
  const textAt = (x, y) => {
    const text = window.prompt('Escribe tu anotación');
    if (!text) return;
    add({ tool: 'texto', points: [[x, y]], text, color: options.texto.color, size: options.texto.size, style: options.texto.style });
  };
  const moveMarker = (i, x, y) => {
    const pageMarkers = items.filter((it) => !it.page || it.page === page);
    const real = items.indexOf(pageMarkers[i]);
    if (real < 0) return;
    const next = [...items];
    next[real] = { ...next[real], points: [[x, y]] };
    setHistory(next); setSaved('idle');
  };
  const deleteMarker = (i) => {
    const pageMarkers = items.filter((it) => !it.page || it.page === page);
    const real = items.indexOf(pageMarkers[i]);
    if (real < 0) return;
    commit(items.filter((_, n) => n !== real));
  };

  const undo = () => { if (!items.length) return; setFuture([...future, items.at(-1)]); setHistory(items.slice(0, -1)); setSaved('idle'); };
  const redo = () => { if (!future.length) return; setHistory([...items, future.at(-1)]); setFuture(future.slice(0, -1)); setSaved('idle'); };

  const save = async () => {
    setSaved('saving');
    try { await onSaveAnnotations(JSON.stringify(items)); setSaved('saved'); setTimeout(() => setSaved('idle'), 2000); }
    catch { setSaved('idle'); }
  };
  const handleListo = async () => { await onSaveAnnotations(JSON.stringify(items)); onPerform(); };

  const zoomIn = () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));

  return (
    <div className="fixed inset-0 bg-black select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 h-14" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <button onClick={onBack} className="h-10 px-3 rounded-xl bg-black/45 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5"><ArrowLeft size={16} /> Editar</button>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-white text-sm font-bold truncate max-w-[38vw]">{song?.title || 'Partitura'}</span>
          <div className="flex items-center gap-1.5 text-white/45 text-[11px]">
            <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="disabled:opacity-30 px-1">‹</button>
            <span>Página {page} / {maxPage}</span>
            <button onClick={() => onPageChange(Math.min(maxPage, page + 1))} disabled={page >= maxPage} className="disabled:opacity-30 px-1">›</button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={undo} disabled={!items.length} className="w-10 h-10 rounded-xl bg-black/45 backdrop-blur-md text-white/75 flex items-center justify-center disabled:opacity-30 border border-white/5" aria-label="Deshacer"><Undo2 size={17} /></button>
          <button onClick={redo} disabled={!future.length} className="w-10 h-10 rounded-xl bg-black/45 backdrop-blur-md text-white/75 flex items-center justify-center disabled:opacity-30 border border-white/5" aria-label="Rehacer"><Redo2 size={17} /></button>
          <button onClick={save} className="w-10 h-10 rounded-xl bg-black/45 backdrop-blur-md text-white/75 flex items-center justify-center border border-white/5" aria-label="Guardar">
            {saved === 'saving' ? <span className="text-[10px]">…</span> : saved === 'saved' ? <Check size={17} className="text-[#c9ef72]" /> : <Save size={17} />}
          </button>
          <button onClick={handleListo} className="h-10 px-4 rounded-xl stage-grad text-white text-sm font-bold flex items-center gap-1.5 shadow-lg"><Check size={16} /> Listo</button>
        </div>
      </div>

      <ScoreCanvas
        song={song} page={page} maxPage={maxPage} onPageChange={onPageChange}
        zoom={zoom} onZoomChange={setZoom} tool={tool} options={options[tool] || {}}
        items={items} onAdd={add} onEraseAt={eraseAt} onTextAt={textAt}
        onMoveMarker={moveMarker} onDeleteMarker={deleteMarker}
      />

      <ToolOptions tool={tool} options={options} setOpt={setOpt} />

      <EditorToolbar tool={tool} setTool={setTool} zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} />

      {saved === 'saved' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 text-[11px] text-white bg-black/70 backdrop-blur rounded-full px-3 h-7 flex items-center gap-1.5 border border-white/10">
          <Check size={12} className="text-[#c9ef72]" /> Guardado
        </div>
      )}
    </div>
  );
}