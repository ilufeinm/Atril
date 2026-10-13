import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, X, Play, Users, Pencil, Trash2, Share2, FileDown, MoreHorizontal } from 'lucide-react';
import { Ticket, ticketDate, daysUntil } from '@/components/glass';
import { localDateISO } from '@/lib/utils';
import { exportSetlistPdf } from '@/lib/exportSetlistPdf';
import ShareCard from '@/components/share/ShareCard';
import useShareCard from '@/components/share/useShareCard';
import { Link, useNavigate } from 'react-router-dom';
import { useStage } from './StageProvider';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import AnimatedCheck from '@/components/motion/AnimatedCheck';

// Fila "levantada" al arrastrar (escala + sombra) y filas vecinas que se acomodan con una curva suave.
const liftStyle = (style, snapshot) => {
  const base = style?.transition && style.transition !== 'none' ? `${style.transition}, ` : '';
  const lifted = snapshot.isDragging && !snapshot.isDropAnimating;
  return {
    ...style,
    scale: lifted ? '1.03' : '1',
    boxShadow: lifted ? '0 18px 36px rgba(0,0,0,.45)' : '0 0 0 rgba(0,0,0,0)',
    transition: snapshot.isDragging
      ? `${base}scale .22s cubic-bezier(.22,1,.36,1), box-shadow .22s`
      : style?.transform ? 'transform .35s cubic-bezier(.22,1,.36,1)' : style?.transition,
  };
};

export default function SetEditor({ setlist }) {
  const { songs, allSongs, saveSet, deleteSet } = useStage();
  const nav = useNavigate();
  const { toast } = useToast();
  const { share, cardRef } = useShareCard();
  const [adding, setAdding] = useState(false);
  const [ids, setIds] = useState(setlist.song_ids || []);
  const [sync, setSync] = useState('idle'); // idle | saving | saved | error
  const [exporting, setExporting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const demo = setlist.is_demo;
  const ordered = ids.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);
  const minutes = Math.round(ordered.reduce((total, s) => total + (s.duration || 180), 0) / 60);

  // Sincroniza el orden local con el servidor, salvo mientras se está guardando
  React.useEffect(() => { if (sync !== 'saving') setIds(setlist.song_ids || []); }, [setlist.song_ids, sync]);

  const persist = async (next) => {
    setSync('saving');
    try {
      await saveSet({ song_ids: next }, setlist.id);
      setSync('saved');
      setTimeout(() => setSync('idle'), 1500);
    } catch (e) {
      setIds(setlist.song_ids || []); // revertir al orden del servidor
      setSync('error');
      toast({ title: 'No se pudo guardar el orden', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' });
    }
  };
  const change = (next) => { setIds(next); persist(next); };
  const drop = (result) => { if (!result.destination || result.destination.index === result.source.index) return; const next = [...ids]; const [item] = next.splice(result.source.index, 1); next.splice(result.destination.index, 0, item); change(next); };
  const retry = () => { if (sync === 'error') persist(ids); };
  const exportPdf = async () => {
    setExporting(true);
    try {
      // Resolver canciones faltantes si hay IDs que no están en allSongs
      const missing = ids.filter((id) => !allSongs.find((s) => s.id === id));
      if (missing.length) {
        const fetched = await Promise.all(missing.map((id) => base44.entities.Song.get(id).catch(() => null)));
        fetched.forEach((s) => { if (s) allSongs.push(s); });
      }
      const ordered = ids.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);
      exportSetlistPdf(setlist, ordered);
      toast({ title: 'PDF descargado', description: `${ordered.length} canciones exportadas.`, variant: 'success' });
    } catch (e) {
      toast({ title: 'No se pudo exportar', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };
  const rename = () => { const n = window.prompt('Nombre del repertorio', setlist.name); if (n && n.trim()) saveSet({ name: n.trim() }, setlist.id); };
  const remove = async () => { if (window.confirm(`¿Eliminar el repertorio "${setlist.name}"?`)) { await deleteSet(setlist.id); nav('/repertorios'); } };

  return (
    <div className="space-y-5">
      {demo && <div className="glass-flat rounded-2xl p-3 text-xs text-white/60 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#c9ef72]"/> Contenido de demostración — solo lectura.</div>}
      {/* La entrada del show: fecha, lugar, canciones, duración y la acción principal. */}
      <Ticket stub={(
        <>
          <span className="flex-1 min-w-0 text-xs text-white/60">{ordered.length} canciones · ≈ {minutes} min</span>
          <Link to={`/presentacion/${setlist.id}`} className="live-cta h-12 px-5 rounded-full font-bold text-sm flex items-center gap-2 shrink-0"><Play size={15} fill="currentColor" /> Tocar en vivo</Link>
        </>
      )}>
        <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold tracking-[.12em] uppercase">
          <span className="text-white/70 truncate">{ticketDate(setlist.date, setlist.time)}</span>
          {daysUntil(setlist.date, localDateISO()) && <span className="text-[#f47b6a] shrink-0">{daysUntil(setlist.date, localDateISO())}</span>}
        </div>
        <h2 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-tight mt-2.5">{setlist.name}</h2>
        <p className="text-white/70 text-sm mt-1.5">{setlist.venue || 'Lugar por definir'}</p>
      </Ticket>
      {/* Acciones: las seguras a la vista; renombrar y eliminar, dentro de "Más". */}
      <div className="flex justify-around">
        <button onClick={() => share(setlist)} className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white"><span className="glass w-12 h-12 rounded-full flex items-center justify-center"><Share2 size={18} /></span>Compartir</button>
        <button onClick={exportPdf} disabled={exporting} className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white disabled:opacity-50"><span className="glass w-12 h-12 rounded-full flex items-center justify-center"><FileDown size={18} /></span>{exporting ? 'Creando…' : 'PDF'}</button>
        {!demo && <>
          <Link to="/modo-banda" className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white"><span className="glass w-12 h-12 rounded-full flex items-center justify-center"><Users size={18} /></span>Con la banda</Link>
          <div className="relative">
            <button onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} aria-label="Más: renombrar o eliminar" className="flex flex-col items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white"><span className="glass w-12 h-12 rounded-full flex items-center justify-center"><MoreHorizontal size={18} /></span>Más</button>
            {moreOpen && (<>
              <button onClick={() => setMoreOpen(false)} className="fixed inset-0 z-10 cursor-default" aria-label="Cerrar menú" />
              <div className="absolute right-0 top-[72px] z-20 w-44 rounded-2xl bg-[#1e1e22] border border-[#2b2b30] p-1 shadow-xl">
                <button onClick={() => { setMoreOpen(false); rename(); }} className="w-full h-11 px-3 rounded-xl flex items-center gap-2.5 text-sm text-white/80 hover:bg-white/5"><Pencil size={16} /> Renombrar</button>
                <button onClick={() => { setMoreOpen(false); remove(); }} className="w-full h-11 px-3 rounded-xl flex items-center gap-2.5 text-sm text-red-300 hover:bg-white/5"><Trash2 size={16} /> Eliminar</button>
              </div>
            </>)}
          </div>
        </>}
      </div>
      <div className="flex items-center justify-between pt-2">
        <div><h3 className="font-display font-bold text-lg flex items-center gap-2 flex-wrap">Orden de canciones{sync === 'saving' && <span className="text-xs text-white/40 font-normal">guardando…</span>}{sync === 'saved' && <span className="text-xs text-[#c9ef72] font-normal inline-flex items-center gap-1"><AnimatedCheck size={14} circle={false} strokeWidth={2.6} /> guardado</span>}{sync === 'error' && <button onClick={retry} className="text-xs text-red-300 font-normal underline">reintentar</button>}</h3><p className="text-sm text-white/40">{demo ? 'Repertorio de ejemplo para explorar.' : 'Arrastrá para cambiar el orden del show.'}</p></div>
        {!demo && <button onClick={() => setAdding(!adding)} className="glass h-9 px-3 rounded-full text-white text-sm flex items-center gap-1 font-bold"><Plus size={17} /> Agregar</button>}
      </div>
      {adding && !demo && <div className="glass-flat p-4 rounded-3xl space-y-2"><div className="flex justify-between text-sm mb-3"><strong>Agregar desde biblioteca</strong><button onClick={() => setAdding(false)} aria-label="Cerrar"><X size={18} /></button></div>{songs.filter((s) => !ids.includes(s.id)).map((s) => <button key={s.id} onClick={() => { change([...ids, s.id]); setAdding(false); }} className="flex justify-between w-full p-3 bg-white/5 rounded-xl text-sm hover:bg-white/10 text-left">{s.title}<Plus size={16} /></button>)}{songs.every((s) => ids.includes(s.id)) && <p className="text-sm text-white/40">Todas tus canciones ya están en este repertorio.</p>}</div>}
      <DragDropContext onDragEnd={drop} onDragStart={() => navigator.vibrate?.(12)}>
        <Droppable droppableId="set-songs">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {ordered.map((s, i) => (
                <Draggable key={s.id} draggableId={s.id} index={i} isDragDisabled={demo}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={liftStyle(provided.draggableProps.style, snapshot)}
                      className={`flex items-center gap-3 rounded-2xl p-3 border ${snapshot.isDragging ? 'bg-[#2a2a30] border-[#8e9aaf]/50' : 'row-flat'}`}
                    >
                      {!demo && <span {...provided.dragHandleProps} aria-label={`Mover ${s.title}`} className="text-white/35 p-1 cursor-grab"><GripVertical size={19} /></span>}
                      <span className="text-sm text-white/55 w-5 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0"><div className="font-semibold text-[15px] truncate">{s.title}</div><div className="text-xs text-white/60">{[s.key, s.bpm ? `${s.bpm} BPM` : null, `${Math.round((s.duration || 180) / 60)} min`].filter(Boolean).join(' · ')}</div></div>
                      {!demo && <button onClick={() => change(ids.filter((id) => id !== s.id))} aria-label={`Quitar ${s.title}`} className="p-2 text-white/35 hover:text-red-300"><X size={17} /></button>}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {!ordered.length && <div className="glass-flat border-dashed text-sm text-white/60 p-8 rounded-3xl text-center">{demo ? 'Repertorio de ejemplo vacío.' : 'Agrega canciones para preparar este show.'}</div>}
      <ShareCard ref={cardRef} item={setlist} kind="setlist" songs={allSongs} />
    </div>
  );
}