import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, ListMusic, Music2, Mic, Trash2, AlertTriangle } from 'lucide-react';
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
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { allSongs } = useStage();
  const load = async () => { setLoading(true); try { const r = await base44.entities.Recording.list('-date'); setRecs(r); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const shown = recs.filter((r) => filter === 'todas' || r.type === filter);
  const confirmDelete = async () => { if (!toDelete) return; setDeleting(true); try { await base44.entities.Recording.delete(toDelete.id); setRecs((p) => p.filter((x) => x.id !== toDelete.id)); setToDelete(null); } catch (e) { console.error(e); } finally { setDeleting(false); } };

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
              <div key={r.id} className="relative bg-[#242831] rounded-2xl overflow-hidden border border-white/[.06] group flex">
                <Link to={`/grabaciones/${r.id}`} className="flex flex-1 min-w-0 hover:bg-[#2a2f3a] transition-colors">
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
                <button onClick={() => setToDelete(r)} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/30 backdrop-blur flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setToDelete(null)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={26} /></div>
            <h2 className="text-xl font-bold">¿Eliminar grabación?</h2>
            <p className="text-sm text-white/50 mt-2">Se borrará “{toDelete.name}” y su audio. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold">{deleting ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}