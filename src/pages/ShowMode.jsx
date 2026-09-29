import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Settings, Mic, Square, LogOut, Pencil } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import ScoreEditor from '@/components/editor/ScoreEditor';
import AnnotationCanvas from '@/components/editor/AnnotationCanvas';
import MarkerLayer from '@/components/editor/MarkerLayer';
import { useStage } from '@/components/stage/StageProvider';
import { useBluetoothPedal, setPedalHandlers } from '@/hooks/useBluetoothPedal';
import { useRecorder } from '@/hooks/useRecorder';
import LiveRecorder from '@/components/recording/LiveRecorder';

const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function ShowMode({ singleSong = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { allSets, allSongs, loading, saveSong } = useStage();
  const show = singleSong ? null : allSets.find((s) => s.id === id);
  const directSong = singleSong ? allSongs.find((s) => s.id === id) : null;
  const list = singleSong ? (directSong ? [directSong] : []) : (show?.song_ids || []).map((key) => allSongs.find((s) => s.id === key)).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const areaRef = useRef(null);
  const tapTimer = useRef(null);
  const wakeRef = useRef(null);
  const recorderRef = useRef(null);
  const song = list[index];
  const annos = (() => { try { return JSON.parse(song?.annotations || '[]'); } catch { return []; } })();
  const pageItems = annos.filter((a) => !a.page || a.page === page);
  const pageMarkers = pageItems.filter((a) => a.tool === 'marcador');
  const pageDrawings = pageItems.filter((a) => a.tool !== 'marcador');
  const pedal = useBluetoothPedal();
  const rec = useRecorder();

  const next = () => {
    if (!song) return;
    if (page < (song.pages || 1)) setPage(page + 1);
    else if (index < list.length - 1) { setIndex(index + 1); setPage(1); }
    areaRef.current?.scrollTo({ top: 0 });
  };
  const prev = () => {
    if (page > 1) setPage(page - 1);
    else if (index > 0) { setIndex(index - 1); setPage(1); }
  };

  const saveAnnotations = async (json) => {
    try { await saveSong({ annotations: json }, song.id); return true; } catch (e) { console.error(e); return false; }
  };
  const handlePerform = () => { setEditing(false); setMenu(false); };
  const handleBack = () => { setEditing(false); nav(singleSong ? '/biblioteca' : `/repertorios?abrir=${id}`); };

  useEffect(() => { if (editing) return; setPedalHandlers({ next, prev }); }, [index, page, song, editing]);
  useEffect(() => {
    const key = (e) => {
      if (editing) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index, page, song, editing]);

  useEffect(() => {
    if (localStorage.getItem('stage-wake') === 'off') return;
    let active = true;
    navigator.wakeLock?.request?.('screen').then((lock) => { if (active) wakeRef.current = lock; else lock.release(); }).catch(() => {});
    return () => { active = false; wakeRef.current?.release(); };
  }, []);

  useEffect(() => { if (rec.state === 'recording') rec.markSong(song, index); }, [index, rec.state, song]);
  useEffect(() => { if (rec.state === 'recording') rec.markPage(page); }, [page, rec.state]);
  useEffect(() => () => clearTimeout(tapTimer.current), []);

  // Toque simple = siguiente página · Doble toque = página anterior
  const handleScreenTap = () => {
    if (menu) { setMenu(false); return; }
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      prev();
    } else {
      tapTimer.current = setTimeout(() => { tapTimer.current = null; next(); }, 280);
    }
  };

  if (loading) return <div className="h-[100dvh] bg-black text-white/50 flex items-center justify-center">Preparando presentación…</div>;
  if (singleSong ? !directSong : !show) return <div className="h-[100dvh] bg-black text-white/50 flex flex-col items-center justify-center gap-4">{singleSong ? 'Partitura no encontrada.' : 'Repertorio no encontrado.'}<Link to={singleSong ? '/biblioteca' : '/repertorios'} className="text-[#c9ef72]">Volver</Link></div>;

  const recording = rec.state === 'recording';

  if (editing && song) {
    return (
      <ScoreEditor
        song={song}
        page={page}
        onPageChange={setPage}
        onSaveAnnotations={saveAnnotations}
        onPerform={handlePerform}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div ref={areaRef} onClick={handleScreenTap} className="absolute inset-0 overflow-hidden flex justify-center" style={{ touchAction: 'manipulation' }}>
        <div className="w-full max-w-[900px] h-full relative">
          <ScorePreview song={song} page={page} fill />
          <AnnotationCanvas items={pageDrawings} />
          <MarkerLayer markers={pageMarkers} readOnly />
        </div>
      </div>

      {recording && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+10px)] left-3 z-30 flex items-center gap-1.5 text-[11px] font-semibold text-red-300 bg-black/40 backdrop-blur-sm rounded-full px-2.5 h-7 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC · {fmt(rec.elapsed)}
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
        aria-label="Configuración"
        className={`absolute top-[calc(env(safe-area-inset-top)+8px)] right-3 z-30 w-11 h-11 rounded-full flex items-center justify-center transition ${menu ? 'bg-black/60 text-white' : 'bg-black/25 text-white/65 hover:text-white'}`}
      >
        <Settings size={20} />
      </button>

      {menu && (
        <>
          <div className="absolute inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenu(false); }} />
          <div className="absolute top-[calc(env(safe-area-inset-top)+58px)] right-3 z-40 w-56 bg-[#161B26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5"
            >
              <Pencil size={17} className="text-[#c9ef72]" />
              <span>Editar</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); recorderRef.current?.toggle(); setMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5"
            >
              {recording ? <Square size={17} className="text-red-400" /> : <Mic size={17} className="text-[#c9ef72]" />}
              <span>{recording ? 'Detener grabación' : 'Grabación'}</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); nav(singleSong ? '/biblioteca' : `/repertorios?abrir=${id}`); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5"
            >
              <LogOut size={17} className="text-white/60" />
              <span>Salir del Modo En Vivo</span>
            </button>
          </div>
        </>
      )}

      <LiveRecorder ref={recorderRef} rec={rec} show={singleSong ? { name: directSong?.title } : show} />
    </div>
  );
}