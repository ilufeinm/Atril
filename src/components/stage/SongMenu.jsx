import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Copy, FolderInput, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from './StageProvider';

export default function SongMenu({ song }) {
  const { saveSong, refresh } = useStage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const rename = () => { const t = window.prompt('Nuevo título', song.title); if (t && t.trim()) { saveSong({ title: t.trim() }, song.id); } setOpen(false); };
  const duplicate = async () => { const { id, created_date, updated_date, created_by_id, ...rest } = song; await saveSong({ ...rest, title: `${song.title} (copia)` }); setOpen(false); };
  const move = () => { const f = window.prompt('Mover a la carpeta (escribí el nombre)', song.folder || ''); if (f !== null) { saveSong({ folder: f.trim() }, song.id); } setOpen(false); };
  const del = async () => { if (window.confirm(`¿Eliminar "${song.title}"? Esta acción no se puede deshacer.`)) { await base44.entities.Song.delete(song.id); await refresh(); } setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Más opciones" className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/10 shrink-0"><MoreHorizontal size={18} className="text-white/50" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-48 bg-[#292d36] rounded-xl border border-white/10 shadow-2xl py-1 text-sm">
          <button onClick={rename} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><Pencil size={15} /> Renombrar</button>
          <button onClick={duplicate} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><Copy size={15} /> Duplicar</button>
          <button onClick={move} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><FolderInput size={15} /> Mover a carpeta</button>
          <button onClick={del} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left text-red-300"><Trash2 size={15} /> Eliminar</button>
        </div>
      )}
    </div>
  );
}