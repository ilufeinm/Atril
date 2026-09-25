import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SharedSetlist({ setlist, songs, editable, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const ids = setlist?.song_ids || [];
  const ordered = ids.map((id) => songs.find((s) => s.id === id)).filter(Boolean);

  const change = async (next) => {
    setBusy(true);
    try {
      await base44.entities.Setlist.update(setlist.id, { song_ids: next });
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

  const drop = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = [...ids];
    const [item] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, item);
    change(next);
  };

  if (!ordered.length) {
    return <div className="text-sm text-white/45 p-8 border border-dashed border-white/15 rounded-xl text-center">El repertorio compartido está vacío.</div>;
  }

  return (
    <DragDropContext onDragEnd={drop}>
      <Droppable droppableId="band-set">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {ordered.map((s, i) => (
              <Draggable key={s.id} draggableId={s.id} index={i} isDragDisabled={!editable || busy}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-3 bg-[#292d36] rounded-xl p-3 border border-white/[.06]">
                    {editable && (
                      <span {...provided.dragHandleProps} className="text-white/35 p-1 cursor-grab">
                        <GripVertical size={19} />
                      </span>
                    )}
                    <span className="text-sm text-white/30 w-6">{String(i + 1).padStart(2, '0')}</span>
                    <Music2 size={16} className="text-[#c9ef72]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{s.title}</div>
                      <div className="text-xs text-white/40">{s.key || '—'} · {s.bpm || '—'} BPM · {Math.round((s.duration || 180) / 60)} min</div>
                    </div>
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