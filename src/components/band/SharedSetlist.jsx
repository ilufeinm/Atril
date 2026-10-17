import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Music2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { tr } from '@/i18n';

export default function SharedSetlist({ setlist, songs, canEdit, onManageScore, onRemoveSong }) {
  const [busy, setBusy] = useState(false);
  const ids = setlist?.song_ids || [];
  const ordered = ids.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean);

  const change = async (next) => { setBusy(true); try { await base44.entities.Setlist.update(setlist.id, { song_ids: next }); } finally { setBusy(false); } };
  const drop = (result) => { if (!result.destination || result.destination.index === result.source.index) return; const next = [...ids]; const [item] = next.splice(result.source.index, 1); next.splice(result.destination.index, 0, item); change(next); };

  if (!ordered.length) return <div className="glass-flat border-dashed text-sm text-white/60 p-8 rounded-3xl text-center">{tr('El repertorio compartido está vacío.')}{canEdit && tr(' Agregá la primera canción.')}</div>;

  return (
    <DragDropContext onDragEnd={drop}>
      <Droppable droppableId="band-set">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {ordered.map((s, i) => (
              <Draggable key={s.id} draggableId={s.id} index={i} isDragDisabled={!canEdit || busy}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="row-flat flex items-center gap-2.5 rounded-2xl p-3 border">
                    {canEdit && <span {...provided.dragHandleProps} className="text-white/35 p-1 cursor-grab"><GripVertical size={19} /></span>}
                    <span className="text-sm text-white/55 w-6 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <Music2 size={16} className="text-[#c9ef72]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] truncate">{s.title}</div>
                      <div className="text-xs text-white/60">{s.artist || '—'}{s.key ? ` · ${s.key}` : ''}{s.bpm ? ` · ${s.bpm} BPM` : ''}</div>
                    </div>
                    {s.file_url ? (
                      <div className="flex items-center gap-1.5">
                        {canEdit && <button onClick={() => onManageScore?.(s)} className="text-xs px-2.5 h-8 rounded-full bg-white/10 text-white/70 flex items-center gap-1"><RefreshCw size={13} /> {tr('Reemplazar')}</button>}
                      </div>
                    ) : canEdit ? (
                      <button onClick={() => onManageScore?.(s)} className="text-xs px-3 h-8 rounded-full bg-white/10 text-white/70 flex items-center gap-1.5"><Plus size={14} /> {tr('Agregar partitura')}</button>
                    ) : (
                      <span className="text-xs text-white/35">{tr('Sin partitura')}</span>
                    )}
                    {canEdit && <button onClick={() => onRemoveSong?.(s)} aria-label={tr('Eliminar canción')} className="p-1.5 text-white/35 hover:text-red-400"><Trash2 size={16} /></button>}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}