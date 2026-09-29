import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Music2 } from 'lucide-react';
import { useStage } from './StageProvider';
import { useToast } from '@/components/ui/use-toast';
import SongMenu from './SongMenu';

export default function SongRow({ song, compact = false }) {
  const { saveSong } = useStage();
  const { toast } = useToast();
  const demo = song.is_demo;
  const [fav, setFav] = useState(!!song.favorite);
  const [pending, setPending] = useState(false);

  useEffect(() => { setFav(!!song.favorite); }, [song.favorite]);

  const toggle = async () => {
    if (pending) return;
    const prev = fav;
    setFav(!prev);
    setPending(true);
    try {
      await saveSong({ favorite: !prev }, song.id);
    } catch (e) {
      setFav(prev);
      toast({ title: 'No se pudo actualizar favorito', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="group flex items-center gap-4 p-3 rounded-2xl border border-white/[.07] bg-[#242831] hover:bg-[#2c313b] transition-colors min-w-0">
      <Link to={`/visor/${song.id}`} className="w-14 h-16 rounded-lg bg-[#e9e9dd] text-[#697359] shrink-0 flex items-center justify-center relative overflow-hidden"><div className="absolute inset-2 border-t border-b border-[#aaa99b]/60 top-5 bottom-5"/><Music2 size={22} className="relative"/></Link>
      <Link to={`/visor/${song.id}`} className="flex-1 min-w-0"><div className="font-semibold text-[15px] truncate flex items-center gap-2">{song.title}{demo && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span>}</div><div className="text-sm text-white/40 truncate mt-0.5">{song.artist || 'Artista desconocido'}</div>{!compact&&<div className="text-xs text-white/35 mt-2">{song.type || 'Chart'} <span className="mx-1.5">·</span> {song.key || '—'} <span className="mx-1.5">·</span> {song.bpm || '—'} BPM</div>}</Link>
      <button title={fav?'Quitar de favoritos':'Agregar a favoritos'} aria-label={fav?'Quitar de favoritos':'Agregar a favoritos'} onClick={toggle} disabled={pending} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-50"><Heart size={18} className={fav ? 'fill-[#c9ef72] text-[#c9ef72]' : 'text-white/40'}/></button><SongMenu song={song}/>
    </div>
  );
}