import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Copy, FolderInput, Trash2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from './StageProvider';
import { useToast } from '@/components/ui/use-toast';

export default function SongMenu({ song }) {
  const { saveSong, refresh } = useStage();
  const nav = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const live = () => { nav(`/en-vivo/${song.id}`); setOpen(false); };
  const rename = async () => { const t = window.prompt('Nuevo título', song.title); setOpen(false); if (t && t.trim()) { try { await saveSong({ title: t.trim() }, song.id); } catch (e) { toast({ title: 'No se pudo renombrar', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' }); } } };
  const duplicate = async () => { const { id, created_date, updated_date, created_by_id, is_demo, ...rest } = song; setOpen(false); try { await saveSong({ ...rest, is_demo: false, title: `${song.title} (copia)` }); } catch (e) { toast({ title: 'No se pudo duplicar', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' }); } };
  const move = async () => { const f = window.prompt('Mover a la carpeta (escribí el nombre)', song.folder || ''); setOpen(false); if (f !== null) { try { await saveSong({ folder: f.trim() }, song.id); } catch (e) { toast({ title: 'No se pudo mover', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' }); } } };
  const del = async () => { if (window.confirm(`¿Eliminar "${song.title}"? Esta acción no se puede deshacer.`)) { await base44.entities.Song.delete(song.id); await refresh(); } setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Más opciones" className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/10 shrink-0"><MoreHorizontal size={18} className="text-white/50" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-48 bg-[#292d36] rounded-xl border border-white/10 shadow-2xl py-1 text-sm">
          <button onClick={live} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left text-[#c9ef72] font-semibold"><Play size={15} fill="currentColor" /> Modo en vivo</button>
          <div className="h-px bg-white/10" />
          <button onClick={rename} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><Pencil size={15} /> Renombrar</button>
          <button onClick={duplicate} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><Copy size={15} /> Duplicar</button>
          <button onClick={move} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left"><FolderInput size={15} /> Mover a carpeta</button>
          <button onClick={del} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-left text-red-300"><Trash2 size={15} /> Eliminar</button>
        </div>
      )}
    </div>
  );
}