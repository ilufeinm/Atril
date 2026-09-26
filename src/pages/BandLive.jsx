import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Radio, Music2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BandLive() {
  const { id } = useParams();
  const [band, setBand] = useState(null);
  const [setlist, setSetlist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [me, setMe] = useState(null);
  const [toast, setToast] = useState(false);
  const lastIndex = useRef(0);

  const load = async () => {
    const [b, s, sg, u] = await Promise.all([base44.entities.Band.get(id), base44.entities.Setlist.list('-updated_date'), base44.entities.Song.list('-updated_date'), base44.auth.me().catch(() => null)]);
    setBand(b); setSetlist(s.find((x) => x.id === b.live_setlist_id) || s.find((x) => x.band_id === id)); setSongs(sg); setMe(u);
    lastIndex.current = b.live_index || 0;
  };

  useEffect(() => {
    load().catch(console.error);
    const unsub = base44.entities.Band.subscribe((e) => {
      if (e.type === 'update' && e.data?.id === id) {
        const prev = lastIndex.current;
        setBand(e.data);
        if (e.data.live_index !== undefined && e.data.live_index !== prev) {
          setToast(true); setTimeout(() => setToast(false), 2500); lastIndex.current = e.data.live_index;
        }
      }
    });
    return unsub;
  }, [id]);

  if (!band) return <div className="text-white/40">Conectando...</div>;
  const isDirector = me && me.id === band.created_by_id;
  const ids = setlist?.song_ids || [];
  const ordered = ids.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean);
  const idx = Math.min(band.live_index || 0, Math.max(ordered.length - 1, 0));
  const current = ordered[idx];
  const next = ordered[idx + 1];

  const setIndex = async (i) => { lastIndex.current = i; await base44.entities.Band.update(id, { live_index: i }); };

  return (
    <div className="fixed inset-0 bg-[#0e1014] z-50 flex flex-col text-white overflow-hidden pt-[env(safe-area-inset-top)] overscroll-y-contain">
      <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
        <Link to={`/modo-banda/${id}`} className="flex items-center gap-2 text-white/60 text-sm"><ArrowLeft size={18} /> Salir</Link>
        <div className="flex items-center gap-2 text-[#c9ef72] text-sm font-semibold"><Radio size={16} className="animate-pulse" /> En vivo</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold mb-3">CANCIÓN ACTUAL</div>
        {current ? (
          <>
            <h1 className="text-4xl sm:text-5xl font-bold">{current.title}</h1>
            {current.artist && <p className="text-white/50 mt-3 text-lg">{current.artist}</p>}
            <div className="flex gap-4 mt-5 text-sm text-white/50">
              <span>{current.key || '—'}</span><span>·</span><span>{current.bpm || '—'} BPM</span>
            </div>
          </>
        ) : <p className="text-white/50">No hay canción seleccionada.</p>}
      </div>

      <div className="px-6 pb-4 text-center">
        <div className="text-white/40 text-sm">Próxima: {next ? next.title : 'Fin del repertorio'}</div>
        <div className="text-white/55 text-sm mt-1">Canción {String(idx + 1).padStart(2, '0')} de {ordered.length}</div>
      </div>

      {isDirector ? (
        <div className="flex items-center justify-center gap-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <button onClick={() => setIndex(Math.max(0, idx - 1))} disabled={idx === 0} className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={28} /></button>
          <Link to={current ? `/visor/${current.id}` : '#'} className="w-16 h-16 rounded-full bg-[#c9ef72] text-[#172013] flex items-center justify-center"><Music2 size={26} /></Link>
          <button onClick={() => setIndex(Math.min(ordered.length - 1, idx + 1))} disabled={idx >= ordered.length - 1} className="w-16 h-16 rounded-full bg-[#c9ef72] text-[#172013] flex items-center justify-center disabled:opacity-30"><ChevronRight size={28} /></button>
        </div>
      ) : (
        <div className="pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-center">
          <Link to={current ? `/visor/${current.id}` : '#'} className="inline-flex items-center gap-2 text-[#c9ef72] text-sm"><Music2 size={18} /> Ver mi partitura</Link>
        </div>
      )}

      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#c9ef72] text-[#172013] px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg"><Check size={16} /> Repertorio actualizado</div>}
    </div>
  );
}