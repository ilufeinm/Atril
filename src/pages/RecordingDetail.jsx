import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CalendarDays, Clock3, ListMusic, Music2, Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import RecordingPlayer from '@/components/recording/RecordingPlayer';
import PerformanceNotes from '@/components/recording/PerformanceNotes';
import useSignedUrl from '@/hooks/useSignedUrl';
import { DetailSkeleton } from '@/components/stage/Skeletons';
import { PageBackdrop } from '@/components/glass';

const fmtDur = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

export default function RecordingDetail() {
  const { id } = useParams();
  const { allSongs } = useStage();
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const seekRef = useRef(null);

  useEffect(() => { base44.entities.Recording.get(id).then(setRec).catch(console.error).finally(() => setLoading(false)); }, [id]);
  const signedAudioUrl = useSignedUrl(rec?.audio_url);
  const remove = async () => { setDeleting(true); try { await base44.entities.Recording.delete(rec.id); window.location.assign('/grabaciones'); } catch (e) { console.error(e); setDeleting(false); setConfirmDel(false); } };

  if (loading) return <DetailSkeleton className="max-w-3xl" rows={3} />;
  if (!rec) return <div className="text-white/70">Grabación no encontrada. <Link to="/grabaciones" className="underline font-semibold text-white">Volver</Link></div>;

  const songs = (() => { try { return JSON.parse(rec.songs || '[]'); } catch { return []; } })();
  const notes = (() => { try { return JSON.parse(rec.notes || '[]'); } catch { return []; } })();
  const saveNotes = async (next) => { const updated = await base44.entities.Recording.update(rec.id, { notes: JSON.stringify(next) }); setRec(updated); };
  const addNote = (n) => saveNotes([...notes, n]);
  const removeNote = (i) => saveNotes(notes.filter((_, idx) => idx !== i));
  const share = async () => { try { await navigator.share?.({ title: rec.name, url: signedAudioUrl || rec.audio_url }); } catch {} };

  return (
    <div className="relative">
    <PageBackdrop motif="wave" height={480} tint="violet" />
    <div className="relative max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/grabaciones" className="glass inline-flex h-10 pl-2.5 pr-4 rounded-full text-sm font-semibold items-center gap-1"><ChevronLeft size={18} /> Grabaciones</Link>
        <button onClick={() => setConfirmDel(true)} aria-label="Eliminar grabación" className="glass w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-red-400"><Trash2 size={17} /></button>
      </div>
      <div>
        <span className={`text-[11px] font-extrabold uppercase tracking-[.12em] ${rec.type === 'performance' ? 'text-[#f47b6a]' : 'text-white/70'}`}>{rec.type === 'performance' ? 'Performance' : 'Ensayo'}</span>
        <h1 className="font-display text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-tight mt-1">{rec.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-white/70">
          <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {new Date(rec.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1.5"><Clock3 size={15} /> {fmtDur(rec.duration)}</span>
          {rec.setlist_name && <span className="flex items-center gap-1.5"><ListMusic size={15} /> {rec.setlist_name}</span>}
          <span className="flex items-center gap-1.5"><Music2 size={15} /> {songs.length} canciones</span>
        </div>
      </div>
      <RecordingPlayer audioUrl={signedAudioUrl || rec.audio_url} songs={songs} duration={rec.duration} allSongs={allSongs} onTime={setTime} registerSeek={(fn) => { seekRef.current = fn; }} onShare={share} />
      <PerformanceNotes notes={notes} currentTime={time} onAdd={addNote} onRemove={removeNote} onSeek={(t) => seekRef.current?.(t)} />
      {confirmDel && (
        <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setConfirmDel(false)}>
          <div className="glass-sheet border rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={26} /></div>
            <h2 className="text-xl font-bold">¿Eliminar grabación?</h2>
            <p className="text-sm text-white/70 mt-2">Se borrará “{rec.name}” y su audio. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDel(false)} disabled={deleting} className="flex-1 h-12 rounded-full bg-white/[.12] text-white font-semibold">Cancelar</button>
              <button onClick={remove} disabled={deleting} className="flex-1 h-12 rounded-full bg-red-500 text-white font-bold">{deleting ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}