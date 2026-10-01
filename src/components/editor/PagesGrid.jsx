import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getPageCount, resolvePage } from '@/lib/songPages';

export default function PagesGrid({ song, currentPage, onSelectPage, onReorder, onClose }) {
  const count = getPageCount(song);
  const [order, setOrder] = useState(() => Array.from({ length: count }, (_, i) => i + 1));
  const [reorderMode, setReorderMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const next = Array.from(order);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setOrder(next);
  };

  const handleDone = async () => {
    setSaving(true);
    try {
      await onReorder(order);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setReorderMode(false);
    }
  };

  const renderThumb = (logicalPage) => {
    const resolved = resolvePage(song, logicalPage);
    if (resolved.kind === 'image') {
      return (
        <Image
          src={resolved.src}
          alt={`Hoja ${logicalPage}`}
          className="w-full h-full object-contain"
          fittingType="fit"
        />
      );
    }
    // PDF o texto: tarjeta numerada
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#fffdf7] text-[#222329]">
        <span className="text-3xl font-bold">{logicalPage}</span>
        <span className="text-xs text-[#8b8b84] tracking-widest uppercase mt-1">Hoja</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between px-3 h-14 shrink-0">
        {reorderMode ? (
          <button onClick={() => setReorderMode(false)} disabled={saving} className="h-10 px-3 rounded-xl bg-black/45 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5 disabled:opacity-50">
            <ArrowLeft size={16} /> Cancelar
          </button>
        ) : (
          <button onClick={onClose} className="h-10 px-3 rounded-xl bg-black/45 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5">
            <ArrowLeft size={16} /> Volver
          </button>
        )}
        <div className="flex flex-col items-center leading-tight">
          <span className="text-white text-sm font-bold truncate max-w-[50vw]">{song?.title || 'Partitura'}</span>
          <span className="text-white/45 text-[11px]">{count} {count === 1 ? 'hoja' : 'hojas'}</span>
        </div>
        {reorderMode ? (
          <button onClick={handleDone} disabled={saving} className="h-10 px-4 rounded-xl stage-grad text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {saving ? 'Guardando…' : 'Listo'}
          </button>
        ) : (
          <button onClick={() => setReorderMode(true)} className="h-10 px-4 rounded-xl bg-black/45 backdrop-blur-md text-white text-sm font-bold flex items-center gap-1.5 border border-white/5">
            Reordenar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="pages" direction="vertical" isDropDisabled={!reorderMode}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {order.map((logicalPage, idx) => (
                  <Draggable key={String(logicalPage)} draggableId={String(logicalPage)} index={idx} isDragDisabled={!reorderMode}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 ${reorderMode ? 'border-white/15' : currentPage === logicalPage ? 'border-[#8e9aaf]' : 'border-white/5'} ${reorderMode ? '' : 'cursor-pointer'}`}
                        onClick={reorderMode ? undefined : () => onSelectPage(logicalPage)}
                      >
                        <div className="absolute inset-0">{renderThumb(logicalPage)}</div>
                        <div className="absolute top-1.5 left-1.5 z-10 min-w-6 h-6 px-1.5 rounded-full bg-black/65 backdrop-blur text-white text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        {reorderMode && (
                          <div {...p.dragHandleProps} className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/65 backdrop-blur text-white flex items-center justify-center">
                            <GripVertical size={15} />
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}