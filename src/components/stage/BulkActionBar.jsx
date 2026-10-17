import React from 'react';
import { createPortal } from 'react-dom';
import { ListMusic, FolderInput, Heart, Trash2, X } from 'lucide-react';
import { tr } from '@/i18n';

// Se dibuja directo en <body>: dentro de la lista (que se mueve al tirar para actualizar),
// "fixed" quedaba atado al final de la lista y con muchas partituras la barra ni se veía.
export default function BulkActionBar({ count, busy, onAddToSetlist, onMoveFolder, onToggleFav, onDelete, onCancel }) {
  const btn = 'flex flex-col items-center justify-center gap-0.5 px-2.5 h-11 rounded-full hover:bg-white/5 disabled:opacity-40';
  const label = 'text-[10px] font-medium';
  return createPortal(
    // "stage-app" para que valgan los colores del modo claro; fondo transparente explícito (esa clase pinta fondo).
    <div data-sheet-hide style={{ background: 'transparent' }} className="stage-app fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="glass-nav pointer-events-auto max-w-md mx-auto rounded-full p-2 flex items-center gap-1 text-white">
        <button onClick={onCancel} aria-label={tr('Cancelar selección')} className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white shrink-0"><X size={18} /></button>
        <span className="text-sm font-bold text-white shrink-0">{count}</span>
        <div className="flex-1" />
        <button title={tr('Agregar a repertorio')} onClick={onAddToSetlist} disabled={busy} className={`${btn} text-white/70`}><ListMusic size={17} /><span className={label}>{tr('Repertorio')}</span></button>
        <button title={tr('Mover a carpeta')} onClick={onMoveFolder} disabled={busy} className={`${btn} text-white/70`}><FolderInput size={17} /><span className={label}>{tr('Carpeta')}</span></button>
        <button title={tr('Alternar favorito')} onClick={onToggleFav} disabled={busy} className={`${btn} text-white/70`}><Heart size={17} /><span className={label}>{tr('Favorito')}</span></button>
        <button title={tr('Eliminar')} onClick={onDelete} disabled={busy} className={`${btn} text-red-300`}><Trash2 size={17} /><span className={label}>{tr('Eliminar')}</span></button>
      </div>
    </div>,
    document.body,
  );
}
