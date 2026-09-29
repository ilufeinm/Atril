import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, X, Play, Clock3, CalendarDays, Users, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStage } from './StageProvider';
import { useToast } from '@/components/ui/use-toast';

export default function SetEditor({ setlist }) {
  const { songs, allSongs, saveSet, deleteSet } = useStage();
  const nav = useNavigate();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const demo = setlist.is_demo;
  const ids = setlist.song_ids || [];
  const ordered = ids.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);
  const minutes = Math.round(ordered.reduce((total, s) => total + (s.duration || 180), 0) / 60);

  const change = async (next) => { setBusy(true); try { await saveSet({ song_ids: next }, setlist.id); } catch (e) { toast({ title: 'No se pudo guardar el orden', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' }); } finally { setBusy(false); } };
  const drop = (result) => { if (!result.destination || result.destination.index === result.source.index) return; const next = [...ids]; const [item] = next.splice(result.source.index, 1); next.splice(result.destination.index, 0, item); change(next); };
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
      <div className="flex flex-wrap gap-3">
        <Link to={`/presentacion/${setlist.id}`} className="h-11 px-5 bg-[#c9ef72] text-[#172013] font-bold rounded-xl flex items-center gap-2 text-sm"><Play size={17} fill="currentColor" /> Comenzar presentación</Link>
        {!demo && <><Link to="/modo-banda" className="h-11 px-4 bg-white/10 text-white rounded-xl flex items-center gap-2 text-sm"><Users size={17} /> Modo banda</Link><button onClick={rename} className="h-11 px-4 bg-white/10 text-white rounded-xl flex items-center gap-2 text-sm"><Pencil size={16} /> Renombrar</button><button onClick={remove} className="h-11 px-4 bg-white/10 text-red-300 rounded-xl flex items-center gap-2 text-sm"><Trash2 size={16} /> Eliminar</button></>}
      </div>
      <div className="flex items-center justify-between pt-3">
        <div><h3 className="font-bold text-lg">Orden de canciones</h3><p className="text-sm text-white/40">{demo ? 'Repertorio de ejemplo para explorar.' : 'Arrastra para cambiar el orden del show.'}</p></div>
        {!demo && <button onClick={() => setAdding(!adding)} className="text-[#c9ef72] text-sm flex items-center gap-1 font-semibold"><Plus size={17} /> Agregar</button>}
      </div>
      {adding && !demo && <div className="bg-[#292d36] p-4 rounded-2xl space-y-2"><div className="flex justify-between text-sm mb-3"><strong>Agregar desde biblioteca</strong><button onClick={() => setAdding(false)} aria-label="Cerrar"><X size={18} /></button></div>{songs.filter((s) => !ids.includes(s.id)).map((s) => <button key={s.id} onClick={() => { change([...ids, s.id]); setAdding(false); }} className="flex justify-between w-full p-3 bg-white/5 rounded-xl text-sm hover:bg-white/10 text-left">{s.title}<Plus size={16} /></button>)}{songs.every((s) => ids.includes(s.id)) && <p className="text-sm text-white/40">Todas tus canciones ya están en este repertorio.</p>}</div>}
      <DragDropContext onDragEnd={drop}>
        <Droppable droppableId="set-songs">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {ordered.map((s, i) => (
                <Draggable key={s.id} draggableId={s.id} index={i} isDragDisabled={busy || demo}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-3 bg-[#292d36] rounded-xl p-3 border border-white/[.06]">
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
    </div>
  );
}