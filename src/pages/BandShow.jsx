import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, MapPin, Radio, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SharedSetlist from '@/components/band/SharedSetlist';

export default function BandShow() {
  const { id, showId } = useParams();
  const [band, setBand] = useState(null);
  const [setlist, setSetlist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    Promise.all([base44.entities.Band.get(id), base44.entities.Setlist.list('-updated_date'), base44.entities.Song.list('-updated_date'), base44.auth.me().catch(() => null)])
      .then(([b, s, sg, u]) => { setBand(b); setSetlist(s.find((x) => x.id === showId)); setSongs(sg); setMe(u); });
  }, [id, showId]);

  if (!band || !setlist) return <div className="text-white/40">Cargando show...</div>;
  const isDirector = me && me.id === band.created_by_id;
  const ordered = (setlist.song_ids || []).map((sid) => songs.find((s) => s.id === sid)).filter(Boolean);
  const minutes = Math.round(ordered.reduce((t, s) => t + (s.duration || 180), 0) / 60);

  const goLive = async () => { await base44.entities.Band.update(id, { live_setlist_id: setlist.id, live_index: 0 }); window.location.href = `/modo-banda/${id}/en-vivo`; };

  return (
    <div className="max-w-3xl space-y-6">
      <Link to={`/modo-banda/${id}`} className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> {band.name}</Link>
      <div className="bg-[#242831] rounded-3xl p-6 border border-white/[.06]">
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold">SHOW</div>
        <h1 className="text-2xl font-bold mt-2">{setlist.name}</h1>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/55">
          <span className="flex items-center gap-2"><CalendarDays size={16} /> {setlist.date ? new Date(setlist.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}</span>
          {setlist.time && <span className="flex items-center gap-2"><Clock3 size={16} /> {setlist.time}</span>}
          <span className="flex items-center gap-2"><MapPin size={16} /> {setlist.venue || 'Lugar por definir'}</span>
          <span className="flex items-center gap-2"><Music2 size={16} /> {ordered.length} canciones · {minutes} min</span>
        </div>
        <button onClick={goLive} className="mt-6 h-12 px-6 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center gap-2"><Radio size={18} /> Iniciar en vivo</button>
      </div>
      <div>
        <h3 className="font-bold mb-3">Repertorio</h3>
        <SharedSetlist setlist={setlist} songs={songs} editable={isDirector} />
      </div>
    </div>
  );
}