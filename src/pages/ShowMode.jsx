import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, StickyNote, Lock, Unlock, Sun, Minus, Plus, Play, Pause, ListMusic, Maximize, Minimize, Bluetooth } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import NotesPanel from '@/components/stage/NotesPanel';
import { useStage } from '@/components/stage/StageProvider';
import { useBluetoothPedal, setPedalHandlers } from '@/hooks/useBluetoothPedal';
import RecordingControl from '@/components/recording/RecordingControl';
import { useRecorder } from '@/hooks/useRecorder';

export default function ShowMode() {
  const { id } = useParams();
  const { allSets, allSongs, loading } = useStage();
  const show = allSets.find((s) => s.id === id);
  const list = (show?.song_ids || []).map((key) => allSongs.find((s) => s.id === key)).filter(Boolean);
  const [index, I] = useState(0);
  const [page, P] = useState(1);
  const [zoom, Z] = useState(1);
  const [bright, B] = useState(100);
  const [locked, L] = useState(false);
  const [auto, A] = useState(false);
  const [notes, N] = useState(false);
  const [menu, M] = useState(false);
  const [fs, Fs] = useState(false);
  const area = useRef(null), touch = useRef(null), wake = useRef(null);
  const song = list[index];
  const pedal = useBluetoothPedal();
  const rec = useRecorder();

  const next = () => { if (!song) return; if (page < (song.pages || 1)) P(page + 1); else if (index < list.length - 1) { I(index + 1); P(1); } area.current?.scrollTo({ top: 0 }); };
  const prev = () => { if (page > 1) P(page - 1); else if (index > 0) { I(index - 1); P(1); } };

  useEffect(() => { setPedalHandlers({ next, prev }); }, [index, page, song]);
  useEffect(() => { if (rec.state === 'recording') rec.markSong(song, index); }, [index, rec.state, song]);
  useEffect(() => { if (rec.state === 'recording') rec.markPage(page); }, [page, rec.state]);
  useEffect(() => { const key = (e) => { if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); } if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [index, page, song]);
  useEffect(() => {
    if (localStorage.getItem('stage-wake') === 'off') return;
    let active = true;
    navigator.wakeLock?.request?.('screen').then((lock) => { if (active) wake.current = lock; else lock.release(); }).catch(() => {});
    return () => { active = false; wake.current?.release(); };
  }, []);
  useEffect(() => {
    const onFs = () => Fs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  useEffect(() => { if (!auto) return; const timer = setInterval(() => { if (area.current) area.current.scrollTop += 1; }, 70); return () => clearInterval(timer); }, [auto]);

  if (loading) return <div className="h-screen bg-[#0c0e12] text-white p-8">Preparando presentación...</div>;
  if (!show) return <div className="h-screen bg-[#0c0e12] text-white p-8">Repertorio no encontrado. <Link to="/repertorios">Volver</Link></div>;

  return (
    <div className="h-[100dvh] bg-[#0c0e12] text-white flex flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="h-16 shrink-0 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/repertorios?abrir=${id}`} aria-label="Salir de presentación" className="p-2"><X size={21} /></Link>
          <div className="min-w-0"><div className="text-[10px] text-[#c9ef72] tracking-widest font-bold truncate">{show.name} · {index + 1} / {list.length}</div><div className="font-semibold text-sm truncate">{song?.title || 'Repertorio vacío'}</div></div>
        </div>
        <div className="flex gap-1 items-center">
          <RecordingControl rec={rec} show={show} />
          {pedal.connected && <span className="text-[#c9ef72] p-2" title={`Pedal: ${pedal.name}`}><Bluetooth size={18} /></span>}
          <button onClick={() => N(true)} disabled={!song || song.is_demo} aria-label="Notas de interpretación" className="p-2 disabled:opacity-40"><StickyNote size={20} /></button>
          <button onClick={toggleFs} aria-label={fs ? 'Salir de pantalla completa' : 'Pantalla completa'} className="p-2">{fs ? <Minimize size={20} /> : <Maximize size={20} />}</button>
          <button onClick={() => L(!locked)} aria-label={locked ? 'Desbloquear gestos' : 'Bloquear gestos'} className={`p-2 ${locked ? 'text-[#c9ef72]' : ''}`}>{locked ? <Lock size={20} /> : <Unlock size={20} />}</button>
          <button onClick={() => M(!menu)} aria-label="Lista de canciones" className="p-2"><ListMusic size={20} /></button>
        </div>
      </header>
      <div className="flex-1 min-h-0 relative bg-[#181a1e]">
        <div ref={area} className="h-full overflow-y-auto overscroll-y-contain select-none px-2 sm:px-8 py-4" onTouchStart={(e) => touch.current = e.touches[0].clientX} onTouchEnd={(e) => { if (!locked && touch.current != null) { let delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 70) (delta < 0 ? next : prev)(); touch.current = null; } }}>
          <div className="max-w-[760px] mx-auto" style={{ filter: `brightness(${bright}%)` }}><ScorePreview song={song} page={page} zoom={zoom} /></div>
        </div>
        {!locked && song && <><button onClick={prev} aria-label="Página o canción anterior" className="absolute left-0 top-1/3 h-1/3 w-10 sm:w-14 flex items-center justify-center text-white/60 hover:bg-black/20"><ChevronLeft /></button><button onClick={next} aria-label="Página o canción siguiente" className="absolute right-0 top-1/3 h-1/3 w-10 sm:w-14 flex items-center justify-center text-white/60 hover:bg-black/20"><ChevronRight /></button></>}
        {!song && <p className="absolute inset-0 flex items-center justify-center text-white/50">Agrega canciones antes de comenzar.</p>}
      </div>
      <footer className="shrink-0 border-t border-white/10 px-4 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-wrap justify-between items-center gap-3 text-xs sm:text-sm">
        <span className="text-white/55">Página {page} / {song?.pages || 1} <span className="hidden sm:inline">· {song?.key || '—'} · {song?.bpm || '—'} BPM</span></span>
        <div className="flex items-center gap-2">
          <button onClick={() => A(!auto)} aria-label={auto ? 'Pausar desplazamiento' : 'Desplazamiento automático'} className={`p-2 ${auto ? 'text-[#c9ef72]' : ''}`}>{auto ? <Pause size={18} /> : <Play size={18} />}</button>
          <Sun size={16} className="text-white/45" /><input type="range" aria-label="Brillo de lectura" min="45" max="130" value={bright} onChange={(e) => B(+e.target.value)} className="w-16 sm:w-24 accent-[#c9ef72]" />
          <button onClick={() => Z(Math.max(.7, +(zoom - .1).toFixed(1)))} aria-label="Reducir zoom" className="p-2"><Minus size={17} /></button>
          <span className="text-white/45 w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => Z(Math.min(1.6, +(zoom + .1).toFixed(1)))} aria-label="Aumentar zoom" className="p-2"><Plus size={17} /></button>
        </div>
      </footer>
      <div className="h-1 bg-white/10"><div className="h-full bg-[#c9ef72]" style={{ width: `${list.length ? (index + page / (song?.pages || 1)) / list.length * 100 : 0}%` }} /></div>
      {notes && song && <NotesPanel song={song} onClose={() => N(false)} />}
      {menu && <div className="fixed inset-0 z-40 bg-black/70 flex justify-end" onMouseDown={(e) => e.target === e.currentTarget && M(false)}><div className="bg-[#292d36] w-full max-w-sm p-6 overflow-y-auto"><div className="flex justify-between mb-5"><h2 className="text-xl font-bold">Orden del show</h2><button onClick={() => M(false)} aria-label="Cerrar"><X /></button></div>{list.map((s, i) => <button key={s.id} onClick={() => { I(i); P(1); M(false); }} className={`w-full text-left p-4 rounded-xl mb-2 ${index === i ? 'bg-[#c9ef72] text-[#172013]' : 'bg-white/5'}`}>{i + 1}. {s.title}</button>)}</div></div>}
    </div>
  );
}