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
    <div className="group flex items-center gap-3 px-2.5 py-2 rounded-xl border border-white/[.07] bg-[#242831] hover:bg-[#2c313b] transition-colors min-w-0">
      <Link to={`/en-vivo/${song.id}`} className="w-10 h-10 rounded-lg bg-[#e9e9dd] text-[#697359] shrink-0 flex items-center justify-center relative overflow-hidden"><div className="absolute inset-x-1.5 border-t border-b border-[#aaa99b]/60 top-3.5 bottom-3.5"/><Music2 size={16} className="relative"/></Link>
      <Link to={`/en-vivo/${song.id}`} className="flex-1 min-w-0"><div className="font-semibold text-sm truncate flex items-center gap-1.5">{song.title}{demo && <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-white/10 text-white/55">Demo</span>}</div><div className="text-xs text-white/40 truncate">{song.artist || 'Artista desconocido'}{!compact && <span className="text-white/30"> · {song.type || 'Chart'} · {song.key || '—'} · {song.bpm || '—'} BPM</span>}</div></Link>
      <button title={fav?'Quitar de favoritos':'Agregar a favoritos'} aria-label={fav?'Quitar de favoritos':'Agregar a favoritos'} onClick={toggle} disabled={pending} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-50 shrink-0"><Heart size={16} className={fav ? 'fill-[#c9ef72] text-[#c9ef72]' : 'text-white/40'}/></button><SongMenu song={song}/>
    </div>
  );
}