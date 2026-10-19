import { motion } from 'framer-motion';
import { cardMotion } from '@/lib/motion';
import LargeTitle from '@/components/stage/LargeTitle';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, ListMusic, Music2, Mic, Trash2, AlertTriangle, Star, Pencil, Check, Play, CloudOff, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import PullToRefresh from '@/components/stage/PullToRefresh';
import ScoreThumb from '@/components/recording/ScoreThumb';
import { RecordingSkeleton } from '@/components/stage/Skeletons';
import { PageBackdrop } from '@/components/glass';
import { StatusState, Chip, btnPrimary, btnSecondary } from '@/components/glass/parts';
import { tr, dateLocale } from '@/i18n';

const fmtDur = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
const FILTERS = [['todas', tr('Todas')], ['performance', tr('Performances')], ['rehearsal', tr('Ensayos')]];

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

  // Si la carga falla, error con Reintentar (antes decía "todavía no tenés grabaciones", #28).
  const [loadFailed, setLoadFailed] = useState(false);
  const load = async () => { setLoading(true); setLoadFailed(false); try { const r = await base44.entities.Recording.list('-date'); setRecs(r); } catch (e) { console.error(e); setLoadFailed(true); } finally { setLoading(false); } };
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
    <div className="relative">
    <PageBackdrop motif="wave" tint="violet" />
    <div className="relative max-w-5xl space-y-6">
      <div>
        <LargeTitle className="font-display text-[28px] sm:text-[32px] font-bold tracking-tight leading-none">{tr('Grabaciones')}</LargeTitle>
        <p className="text-white/70 text-sm mt-2">{tr('Tus shows y ensayos, con la partitura sincronizada.')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(([k, label]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{label}</Chip>
        ))}
        <Chip active={favOnly} onClick={() => setFavOnly((v) => !v)}>
          <Star size={12} fill={favOnly ? 'currentColor' : 'none'} /> {tr('Favoritas')}
        </Chip>
      </div>
      {loading ? (
        <RecordingSkeleton count={3} />
      ) : loadFailed ? (
        <StatusState tone="error" icon={CloudOff} title={tr('No pudimos cargar tus grabaciones')} text={tr('Revisá tu conexión y volvé a intentar. Tus grabaciones siguen guardadas.')} actions={<button type="button" onClick={load} className={btnPrimary}><RotateCw size={16} aria-hidden="true" /> {tr('Reintentar')}</button>} />
      ) : !shown.length && recs.length ? (
        <StatusState icon={Mic} title={tr('Nada coincide')} text={tr('Ninguna grabación coincide con este filtro.')} actions={<button type="button" onClick={() => { setFilter('todas'); setFavOnly(false); }} className={btnSecondary}>{tr('Ver todas')}</button>} />
      ) : !shown.length ? (
        <StatusState icon={Mic} title={tr('Todavía no tenés grabaciones')} text={tr('Grabá un ensayo y escuchalo con la partitura sincronizada.')} actions={<Link to="/biblioteca" className={btnPrimary}><Play size={16} fill="currentColor" aria-hidden="true" /> {tr('Ir a presentar')}</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {shown.map((r, idx) => {
            const songs = (() => { try { return JSON.parse(r.songs || '[]'); } catch { return []; } })();
            const firstSong = songs[0] ? allSongs.find((s) => s.id === songs[0].song_id) : null;
            const isRenaming = renamingId === r.id;
            return (
              <motion.div key={r.id} {...cardMotion(idx)} className="press-none relative glass-flat rounded-2xl overflow-hidden group flex">
                
                <Link
                  to={`/grabaciones/${r.id}`}
                  onPointerDown={() => startHold(r)}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  className="flex flex-1 min-w-0 p-2.5 gap-1 hover:bg-white/[.04] transition-colors"
                >
                  <div className="w-[72px] sm:w-20 shrink-0 rounded-2xl overflow-hidden bg-[#fffdf7] self-start"><div className="aspect-[3/4]"><ScoreThumb song={firstSong} /></div></div>
                  <div className="min-w-0 flex-1 px-3 py-2 pr-10 flex flex-col justify-center">
                    {isRenaming ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(r); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={() => commitRename(r)}
                          className="w-full bg-[#1e1e22] border border-white/40 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white outline-none"
                        />
                        <button onClick={(e) => { e.preventDefault(); commitRename(r); }} className="home-cta w-8 h-8 rounded-full flex items-center justify-center shrink-0"><Check size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <span className={`self-start text-[10px] font-extrabold uppercase tracking-[.1em] ${r.type === 'performance' ? 'text-[#f47b6a]' : 'text-white/60'}`}>{r.type === 'performance' ? tr('Performance') : tr('Ensayo')}</span>
                        <div className="flex items-center gap-1.5 mt-1 min-w-0">
                          <h3 className="font-display text-[17px] font-bold truncate">{r.name}</h3>
                          {r.favorite && <Star size={14} fill="currentColor" className="lime-text shrink-0" aria-label={tr('Favorita')} />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-white/60">
                          <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(r.date).toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short' })}</span>
                          <span className="flex items-center gap-1"><Clock3 size={12} /> {fmtDur(r.duration)}</span>
                          {r.setlist_name && <span className="flex items-center gap-1"><ListMusic size={12} /> {r.setlist_name}</span>}
                          <span className="flex items-center gap-1"><Music2 size={12} /> {songs.length}</span>
                        </div>
                      </>
                    )}
                  </div>
                </Link>
                <button onClick={() => setToDelete(r)} aria-label={tr('Eliminar grabación')} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-white/[.06] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={15} /></button>

                {menuId === r.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div className="absolute top-11 right-2 z-50 w-48 bg-[#1e1e22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      <button onClick={() => startRename(r)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5">
                        <Pencil size={15} className="text-white/60" /> {tr('Renombrar')}
                      </button>
                      <div className="h-px bg-white/10" />
                      <button onClick={() => toggleFav(r)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5">
                        <Star size={15} className={r.favorite ? 'text-[#c9ef72]' : 'text-white/50'} fill={r.favorite ? 'currentColor' : 'none'} />
                        {r.favorite ? tr('Quitar favorita') : tr('Marcar favorita')}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      {toDelete && (
        <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setToDelete(null)}>
          <div className="glass-sheet border rounded-2xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={26} /></div>
            <h2 className="text-xl font-bold">{tr('¿Eliminar grabación?')}</h2>
            <p className="text-sm text-white/70 mt-2">{tr('Se borrará “{{name}}” y su audio. Esta acción no se puede deshacer.', { name: toDelete.name })}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="flex-1 h-12 rounded-full bg-white/[.12] text-white font-semibold">{tr('Cancelar')}</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 h-12 rounded-full bg-red-500 text-white font-bold">{deleting ? tr('Eliminando…') : tr('Eliminar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </PullToRefresh>
  );
}