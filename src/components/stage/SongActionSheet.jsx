import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Pencil, Copy, FolderInput, Trash2, Play, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SHEET_SPRING, EASE_OUT } from '@/lib/motion';
import { base44 } from '@/api/base44Client';
import { useStage } from './StageProvider';
import { useToast } from '@/components/ui/use-toast';

export default function SongActionSheet({ song, onClose, onSaved }) {
  const { saveSong, refresh } = useStage();
  const nav = useNavigate();
  const { toast } = useToast();
  if (!song) return null;
  const fav = !!song.favorite;

  const act = async (fn, close = true) => {
    try { await fn(); if (close) { onClose(); onSaved?.(); } }
    catch (e) { toast({ title: 'No se pudo completar', description: e.message, variant: 'destructive' }); onClose(); }
  };
  const live = () => { onClose(); nav(`/en-vivo/${song.id}`); };
  const toggleFav = () => act(() => saveSong({ favorite: !fav }, song.id));
  const rename = () => { const t = window.prompt('Nuevo título', song.title); if (t && t.trim()) act(() => saveSong({ title: t.trim() }, song.id)); else onClose(); };
  const duplicate = () => { const { id, created_date, updated_date, created_by_id, is_demo, ...rest } = song; act(() => saveSong({ ...rest, is_demo: false, title: `${song.title} (copia)` })); };
  const move = () => { const f = window.prompt('Mover a la carpeta (escribí el nombre)', song.folder || ''); if (f !== null) act(() => saveSong({ folder: f.trim() }, song.id)); else onClose(); };
  const del = () => { if (window.confirm(`¿Eliminar "${song.title}"? Esta acción no se puede deshacer.`)) act(async () => { await base44.entities.Song.delete(song.id); await refresh(); }); else onClose(); };

  const actions = [
    { icon: Play, label: 'Modo en vivo', onClick: live, cls: 'text-[#8e9aaf] font-semibold' },
    { icon: Heart, label: fav ? 'Quitar de favoritos' : 'Agregar a favoritos', onClick: toggleFav, cls: fav ? 'text-[#8e9aaf]' : '' },
    { icon: Pencil, label: 'Renombrar', onClick: rename },
    { icon: Copy, label: 'Duplicar', onClick: duplicate },
    { icon: FolderInput, label: 'Mover a carpeta', onClick: move },
    { icon: Trash2, label: 'Eliminar', onClick: del, cls: 'text-red-300' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-[#292d36] rounded-t-3xl w-full max-w-md overflow-hidden pb-[env(safe-area-inset-bottom)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={SHEET_SPRING}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.7 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{song.title}</div>
            <div className="text-xs text-white/45 truncate">{song.artist || 'Artista desconocido'}</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-white/50 shrink-0"><X size={20} /></button>
        </div>
        <div className="px-2 pb-4">
          {actions.map((a, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 + i * 0.04 }}
              onClick={a.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm select-none hover:bg-white/5 ${a.cls || 'text-white'}`}
            >
              <a.icon size={18} className={a.iconClass || ''} /> {a.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}