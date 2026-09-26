import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, ListMusic, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import AudioPlayer from '@/components/recording/AudioPlayer';
import PerformanceNotes from '@/components/recording/PerformanceNotes';
import SyncedScore from '@/components/recording/SyncedScore';

const fmtDur = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };

export default function RecordingDetail() {
  const { id } = useParams();
  const { allSongs } = useStage();
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const seekRef = useRef(null);

  useEffect(() => { base44.entities.Recording.get(id).then(setRec).catch(console.error).finally(() => setLoading(false)); }, [id]);

  if (loading) return <div className="text-white/50">Cargando grabación…</div>;
  if (!rec) return <div className="text-white/50">Grabación no encontrada. <Link to="/grabaciones" className="text-[#c9ef72]">Volver</Link></div>;

  const songs = (() => { try { return JSON.parse(rec.songs || '[]'); } catch { return []; } })();
  const notes = (() => { try { return JSON.parse(rec.notes || '[]'); } catch { return []; } })();
  const saveNotes = async (next) => { const updated = await base44.entities.Recording.update(rec.id, { notes: JSON.stringify(next) }); setRec(updated); };
  const addNote = (n) => saveNotes([...notes, n]);
  const removeNote = (i) => saveNotes(notes.filter((_, idx) => idx !== i));
  const share = async () => { try { await navigator.share?.({ title: rec.name, url: rec.audio_url }); } catch {} };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 md:static md:z-auto -mx-4 sm:-mx-8 px-4 sm:px-8 md:mx-0 md:px-0 py-3 md:py-0 bg-[#0B0E14]/90 backdrop-blur-xl md:bg-transparent border-b border-white/5 md:border-0">
        <Link to="/grabaciones" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft size={16} /> Mis grabaciones</Link>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${rec.type === 'performance' ? 'bg-[#c9ef72]/15 text-[#c9ef72]' : 'bg-sky-500/15 text-sky-300'}`}>{rec.type === 'performance' ? 'Performance' : 'Ensayo'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{rec.name}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/45">
          <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {new Date(rec.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1.5"><Clock3 size={15} /> {fmtDur(rec.duration)}</span>
          {rec.setlist_name && <span className="flex items-center gap-1.5"><ListMusic size={15} /> {rec.setlist_name}</span>}
          <span className="flex items-center gap-1.5"><Music2 size={15} /> {songs.length} canciones</span>
        </div>
      </div>
      <AudioPlayer audioUrl={rec.audio_url} songs={songs} duration={rec.duration} onTime={setTime} registerSeek={(fn) => { seekRef.current = fn; }} onShare={share} />
      <SyncedScore songs={songs} currentTime={time} allSongs={allSongs} />
      <PerformanceNotes notes={notes} currentTime={time} onAdd={addNote} onRemove={removeNote} onSeek={(t) => seekRef.current?.(t)} />
    </div>
  );
}