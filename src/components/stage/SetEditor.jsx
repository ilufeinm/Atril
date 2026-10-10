import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, X, Play, Clock3, CalendarDays, Users, Pencil, Trash2, Share2, FileDown } from 'lucide-react';
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
      {demo && <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/55 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#c9ef72]"/> Contenido de demostración — solo lectura.</div>}
      <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
        <span className="flex items-center gap-2"><CalendarDays size={16} /> {setlist.date ? new Date(setlist.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}</span>
        <span>·</span><span>{setlist.venue || 'Lugar por definir'}</span><span>·</span>
        <span className="flex items-center gap-1"><Clock3 size={16} /> {minutes} min</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/presentacion/${setlist.id}`} className="h-9 px-4 bg-[#8e9aaf] text-[#121212] font-semibold rounded-lg flex items-center gap-1.5 text-xs"><Play size={14} fill="currentColor" /> <span className="hidden xs:inline">Comenzar</span> presentación</Link>
        <button onClick={() => share(setlist)} className="h-9 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center gap-1.5 text-xs border border-white/[.06]"><Share2 size={14} /> <span className="hidden sm:inline">Compartir</span></button>
        <button onClick={exportPdf} disabled={exporting} className="h-9 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center gap-1.5 text-xs border border-white/[.06] disabled:opacity-50"><FileDown size={14} /> <span className="hidden sm:inline">{exporting ? 'Generando…' : 'Exportar PDF'}</span></button>
        {!demo && <>
          <Link to="/modo-banda" className="h-9 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center gap-1.5 text-xs border border-white/[.06]"><Users size={14} /> <span className="hidden sm:inline">Modo banda</span></Link>
          <button onClick={rename} className="h-9 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center gap-1.5 text-xs border border-white/[.06]"><Pencil size={14} /> <span className="hidden sm:inline">Renombrar</span></button>
          <button onClick={remove} className="h-9 px-3 bg-white/5 hover:bg-white/10 text-red-300/80 hover:text-red-300 rounded-lg flex items-center gap-1.5 text-xs border border-white/[.06]"><Trash2 size={14} /> <span className="hidden sm:inline">Eliminar</span></button>
        </>}
      </div>
      <div className="flex items-center justify-between pt-3">
        <div><h3 className="font-bold text-lg flex items-center gap-2 flex-wrap">Orden de canciones{sync === 'saving' && <span className="text-xs text-white/40 font-normal">guardando…</span>}{sync === 'saved' && <span className="text-xs text-[#c9ef72] font-normal inline-flex items-center gap-1"><AnimatedCheck size={14} circle={false} strokeWidth={2.6} /> guardado</span>}{sync === 'error' && <button onClick={retry} className="text-xs text-red-300 font-normal underline">reintentar</button>}</h3><p className="text-sm text-white/40">{demo ? 'Repertorio de ejemplo para explorar.' : 'Arrastra para cambiar el orden del show.'}</p></div>
        {!demo && <button onClick={() => setAdding(!adding)} className="text-[#c9ef72] text-sm flex items-center gap-1 font-semibold"><Plus size={17} /> Agregar</button>}
      </div>
      {adding && !demo && <div className="bg-[#292d36] p-4 rounded-2xl space-y-2"><div className="flex justify-between text-sm mb-3"><strong>Agregar desde biblioteca</strong><button onClick={() => setAdding(false)} aria-label="Cerrar"><X size={18} /></button></div>{songs.filter((s) => !ids.includes(s.id)).map((s) => <button key={s.id} onClick={() => { change([...ids, s.id]); setAdding(false); }} className="flex justify-between w-full p-3 bg-white/5 rounded-xl text-sm hover:bg-white/10 text-left">{s.title}<Plus size={16} /></button>)}{songs.every((s) => ids.includes(s.id)) && <p className="text-sm text-white/40">Todas tus canciones ya están en este repertorio.</p>}</div>}
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
                      className={`flex items-center gap-3 rounded-xl p-3 border ${snapshot.isDragging ? 'bg-[#323744] border-[#8e9aaf]/40' : 'bg-[#292d36] border-white/[.06]'}`}
                    >
                      {!demo && <span {...provided.dragHandleProps} aria-label={`Mover ${s.title}`} className="text-white/35 p-1 cursor-grab"><GripVertical size={19} /></span>}
                      <span className="text-sm text-white/30 w-5">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{s.title}</div><div className="text-xs text-white/40">{s.key || '—'} · {s.bpm || '—'} BPM · {Math.round((s.duration || 180) / 60)} min</div></div>
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
      {!ordered.length && <div className="text-sm text-white/45 p-8 border border-dashed border-white/15 rounded-xl text-center">{demo ? 'Repertorio de ejemplo vacío.' : 'Agrega canciones para preparar este show.'}</div>}
      <ShareCard ref={cardRef} item={setlist} kind="setlist" songs={allSongs} />
    </div>
  );
}