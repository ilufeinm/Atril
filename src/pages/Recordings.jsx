import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, ListMusic, Music2, Mic, Trash2, AlertTriangle, Star, Pencil, Check, X, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import PullToRefresh from '@/components/stage/PullToRefresh';
import ScoreThumb from '@/components/recording/ScoreThumb';
import { RecordingSkeleton } from '@/components/stage/Skeletons';

const fmtDur = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
const FILTERS = [['todas', 'Todas'], ['performance', 'Performances'], ['rehearsal', 'Ensayos']];

export default function Recordings() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [favOnly, setFavOnly] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const { allSongs } = useStage();
  const holdTimer = useRef(null);

  const load = async () => { setLoading(true); try { const r = await base44.entities.Recording.list('-date'); setRecs(r); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const shown = recs.filter((r) => (filter === 'todas' || r.type === filter) && (!favOnly || r.favorite));

  const startHold = (r) => {
    holdTimer.current = setTimeout(() => { setMenuId(r.id); }, 500);
  };
  const cancelHold = () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } };

  const toggleFav = async (r) => {
    setMenuId(null);
    try { await base44.entities.Recording.update(r.id, { favorite: !r.favorite }); setRecs((p) => p.map((x) => x.id === r.id ? { ...x, favorite: !x.favorite } : x)); } catch (e) { console.error(e); }
  };

  const startRename = (r) => {
    setMenuId(null);
    setRenamingId(r.id);
    setRenameVal(r.name);
  };

  const commitRename = async (r) => {
    const name = renameVal.trim();
    setRenamingId(null);
    if (!name || name === r.name) return;
    try { await base44.entities.Recording.update(r.id, { name }); setRecs((p) => p.map((x) => x.id === r.id ? { ...x, name } : x)); } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => { if (!toDelete) return; setDeleting(true); try { await base44.entities.Recording.delete(toDelete.id); setRecs((p) => p.filter((x) => x.id !== toDelete.id)); setToDelete(null); } catch (e) { console.error(e); } finally { setDeleting(false); } };

  return (
    <PullToRefresh onRefresh={load}>
    <div className="max-w-5xl space-y-8">
      <div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold uppercase">Audio + partitura</div>
        <h1 className="text-3xl font-bold mt-2">Mis grabaciones</h1>
        <p className="text-white/45 mt-2">Revisá tus performances y ensayos con partitura sincronizada.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-4 h-10 rounded-xl text-sm font-semibold ${filter === k ? 'bg-[#c9ef72] text-[#172013]' : 'bg-white/8 text-white/60'}`}>{label}</button>
        ))}
        <button onClick={() => setFavOnly((v) => !v)} className={`px-4 h-10 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${favOnly ? 'bg-[#c9ef72] text-[#172013]' : 'bg-white/8 text-white/60'}`}>
          <Star size={14} fill={favOnly ? 'currentColor' : 'none'} /> Favoritas
        </button>
      </div>
      {loading ? (
        <RecordingSkeleton count={3} />
      ) : !shown.length ? (
        <div className="border border-dashed border-white/15 rounded-2xl p-12 text-center">
          <Mic size={40} className="text-white/25 mx-auto mb-4" />
          <p className="text-white/80 font-medium">Todavía no tenés grabaciones</p>
          <p className="text-white/45 text-sm mt-1.5">Grabá un ensayo y escuchalo con la partitura sincronizada.</p>
          <Link to="/biblioteca" className="mt-5 inline-flex h-11 px-5 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm items-center gap-2"><Play size={16} fill="currentColor" /> Ir a presentar</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {shown.map((r) => {
            const songs = (() => { try { return JSON.parse(r.songs || '[]'); } catch { return []; } })();
            const firstSong = songs[0] ? allSongs.find((s) => s.id === songs[0].song_id) : null;
            const isRenaming = renamingId === r.id;
            return (
              <div key={r.id} className="relative bg-[#242831] rounded-2xl overflow-hidden border border-white/[.06] group flex">
                {r.favorite && <span className="absolute top-0 left-0 z-20 w-7 h-7 rounded-br-2xl bg-[#c9ef72]/15 flex items-center justify-center"><Star size={13} fill="#c9ef72" className="text-[#c9ef72]" /></span>}
                <Link
                  to={`/grabaciones/${r.id}`}
                  onPointerDown={() => startHold(r)}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  className="flex flex-1 min-w-0 hover:bg-[#2a2f3a] transition-colors"
                >
                  <div className="w-24 sm:w-28 shrink-0 bg-[#1e1e22]"><div className="aspect-[3/4]"><ScoreThumb song={firstSong} /></div></div>
                  <div className="min-w-0 flex-1 p-4 flex flex-col justify-center">
                    {isRenaming ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(r); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={() => commitRename(r)}
                          className="w-full bg-[#1e1e22] border border-[#c9ef72] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none"
                        />
                        <button onClick={(e) => { e.preventDefault(); commitRename(r); }} className="w-7 h-7 rounded-lg bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0"><Check size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold truncate">{r.name}</h3>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.type === 'performance' ? 'bg-[#c9ef72]/15 text-[#c9ef72]' : 'bg-sky-500/15 text-sky-300'}`}>{r.type === 'performance' ? 'Performance' : 'Ensayo'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/40">
                          <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(r.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>
                          <span className="flex items-center gap-1"><Clock3 size={12} /> {fmtDur(r.duration)}</span>
                          {r.setlist_name && <span className="flex items-center gap-1"><ListMusic size={12} /> {r.setlist_name}</span>}
                          <span className="flex items-center gap-1"><Music2 size={12} /> {songs.length}</span>
                        </div>
                      </>
                    )}
                  </div>
                </Link>
                <button onClick={() => setToDelete(r)} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/30 backdrop-blur flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={15} /></button>

                {menuId === r.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div className="absolute top-10 right-2 z-50 w-44 bg-[#292d36] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <button onClick={() => startRename(r)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5">
                        <Pencil size={15} className="text-[#c9ef72]" /> Renombrar
                      </button>
                      <div className="h-px bg-white/10" />
                      <button onClick={() => toggleFav(r)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5">
                        <Star size={15} className={r.favorite ? 'text-[#c9ef72]' : 'text-white/50'} fill={r.favorite ? 'currentColor' : 'none'} />
                        {r.favorite ? 'Quitar favorita' : 'Marcar favorita'}
                      </button>
                    </div>
                  </>
                )}
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