import React from 'react';
import { ListMusic, FolderInput, Heart, Trash2, X } from 'lucide-react';

export default function BulkActionBar({ count, busy, onAddToSetlist, onMoveFolder, onToggleFav, onDelete, onCancel }) {
  const btn = 'flex flex-col items-center justify-center gap-0.5 px-2.5 h-11 rounded-xl hover:bg-white/5 disabled:opacity-40';
  const label = 'text-[9px] font-medium';
  return (
    <div data-sheet-hide className="fixed bottom-16 md:bottom-4 inset-x-0 z-40 px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto bg-[#292d36] rounded-2xl border border-white/10 shadow-2xl p-2.5 flex items-center gap-1">
        <button onClick={onCancel} aria-label="Cancelar selección" className="p-2 text-white/50 hover:text-white shrink-0"><X size={18} /></button>
        <span className="text-sm font-bold text-white/80 shrink-0">{count}</span>
        <div className="flex-1" />
        <button title="Agregar a repertorio" onClick={onAddToSetlist} disabled={busy} className={`${btn} text-white/70`}><ListMusic size={17} /><span className={label}>Repertorio</span></button>
        <button title="Mover a carpeta" onClick={onMoveFolder} disabled={busy} className={`${btn} text-white/70`}><FolderInput size={17} /><span className={label}>Carpeta</span></button>
        <button title="Alternar favorito" onClick={onToggleFav} disabled={busy} className={`${btn} text-white/70`}><Heart size={17} /><span className={label}>Favorito</span></button>
        <button title="Eliminar" onClick={onDelete} disabled={busy} className={`${btn} text-red-300`}><Trash2 size={17} /><span className={label}>Eliminar</span></button>
      </div>
    </div>
  );
}