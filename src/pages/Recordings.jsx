import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, ListMusic, Music2, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import PullToRefresh from '@/components/stage/PullToRefresh';
import ScoreThumb from '@/components/recording/ScoreThumb';

const fmtDur = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
const FILTERS = [['todas', 'Todas'], ['performance', 'Performances'], ['rehearsal', 'Ensayos']];

export default function Recordings() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const { allSongs } = useStage();
  const load = async () => { setLoading(true); try { const r = await base44.entities.Recording.list('-date'); setRecs(r); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const shown = recs.filter((r) => filter === 'todas' || r.type === filter);

  return (
    <PullToRefresh onRefresh={load}>
    <div className="max-w-5xl space-y-8">
      <div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold uppercase">Audio + partitura</div>
        <h1 className="text-3xl font-bold mt-2">Mis grabaciones</h1>
        <p className="text-white/45 mt-2">Revisá tus performances y ensayos con partitura sincronizada.</p>
      </div>
      <div className="flex gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-4 h-10 rounded-xl text-sm font-semibold ${filter === k ? 'bg-[#c9ef72] text-[#172013]' : 'bg-white/8 text-white/60'}`}>{label}</button>
        ))}
      </div>
      {loading ? (
        <div className="text-white/40">Cargando…</div>
      ) : !shown.length ? (
        <div className="border border-dashed border-white/15 rounded-2xl p-12 text-center">
          <Mic size={40} className="text-white/25 mx-auto mb-4" />
          <p className="text-white/55">Todavía no tenés grabaciones.</p>
          <p className="text-sm text-white/35 mt-1">Iniciá una grabación desde el Modo Presentación.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {shown.map((r) => {
            const songs = (() => { try { return JSON.parse(r.songs || '[]'); } catch { return []; } })();
            const firstSong = songs[0] ? allSongs.find((s) => s.id === songs[0].song_id) : null;
            return (
              <Link key={r.id} to={`/grabaciones/${r.id}`} className="bg-[#242831] rounded-2xl overflow-hidden hover:bg-[#2a2f3a] transition-colors border border-white/[.06] group flex">
                <div className="w-24 sm:w-28 shrink-0 bg-[#1e1e22]"><div className="aspect-[3/4]"><ScoreThumb song={firstSong} /></div></div>
                <div className="min-w-0 flex-1 p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2"><h3 className="font-bold truncate">{r.name}</h3><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.type === 'performance' ? 'bg-[#c9ef72]/15 text-[#c9ef72]' : 'bg-sky-500/15 text-sky-300'}`}>{r.type === 'performance' ? 'Performance' : 'Ensayo'}</span></div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/40">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(r.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>
                    <span className="flex items-center gap-1"><Clock3 size={12} /> {fmtDur(r.duration)}</span>
                    {r.setlist_name && <span className="flex items-center gap-1"><ListMusic size={12} /> {r.setlist_name}</span>}
                    <span className="flex items-center gap-1"><Music2 size={12} /> {songs.length}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}