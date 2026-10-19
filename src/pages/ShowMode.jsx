import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, Mic, Square, LogOut, Pencil } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import ScoreEditor from '@/components/editor/ScoreEditor';
import AnnotationCanvas from '@/components/editor/AnnotationCanvas';
import MarkerLayer from '@/components/editor/MarkerLayer';
import { useStage } from '@/components/stage/StageProvider';
import { useFullSongs } from '@/hooks/useStageQueries';
import { prepareSongsOffline } from '@/lib/offlineScores';
import { useSongConversion } from '@/hooks/useSongConversion';
import { getPageCount, needsConversion } from '@/lib/songPages';
import { useBluetoothPedal, setPedalHandlers } from '@/hooks/useBluetoothPedal';
import { useRecorder } from '@/hooks/useRecorder';
import LiveRecorder from '@/components/recording/LiveRecorder';
import TapZoneHint from '@/components/stage/TapZoneHint';
import { heroReveal, heroOut } from '@/lib/hero';
import { startKeepAwake, stopKeepAwake } from '@/lib/keepAwake';
import { base44 } from '@/api/base44Client';
import { tr } from '@/i18n';

const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function ShowMode({ singleSong = false }) {
  const qc = useQueryClient();
  const { id } = useParams();
  const nav = useNavigate();
  const { allSets, allSongs, loading, saveSong, loadSets, setsLoaded, user } = useStage();
  useEffect(() => { loadSets(); }, [loadSets]);
  const show = singleSong ? null : allSets.find((s) => s.id === id);
  const slimSong = singleSong ? allSongs.find((s) => s.id === id) : null;
  const slimIds = singleSong ? (slimSong ? [slimSong.id] : []) : (show?.song_ids || []);
  // Al abrir la presentación, guardar en segundo plano todo el set para usarlo sin conexión.
  useEffect(() => {
    const list = slimIds.map((sid) => allSongs.find((s) => s.id === sid)).filter(Boolean);
    if (list.length) prepareSongsOffline(list).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slimIds.join('|')]);
  const { fullMap, ready: fullReady } = useFullSongs(slimIds);
  // Mezcla: slim (liviano) + full (anotaciones/contenido). Slim gana en campos compartidos.
  const list = slimIds.map((sid) => {
    const slim = singleSong ? slimSong : allSongs.find((s) => s.id === sid);
    return { ...(fullMap[sid] || {}), ...(slim || {}) };
  }).filter((s) => s?.id);

  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState(false);
  // Confirmación al apoyar el dedo (apple-design: resaltar al tocar, confirmar al soltar).
  // El cambio de página sigue ocurriendo al soltar (onClick) para evitar pases accidentales.
  const [pressSide, setPressSide] = useState(null); // 'prev' | 'next' | null
  const [tapped, setTapped] = useState(false); // primer toque: oculta la ayuda de zonas
  const pressTimer = useRef(null);
  useEffect(() => () => clearTimeout(pressTimer.current), []);
  const [editing, setEditing] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const fontSaveRef = useRef(null);
  const [contentRect, setContentRect] = useState(null);
  const areaRef = useRef(null);
  const recorderRef = useRef(null);
  const song = list[index];
  const { progress: convProgress, error: convError, retry: retryConversion } = useSongConversion(song);
  const annos = useMemo(() => { try { return JSON.parse(song?.annotations || '[]'); } catch { return []; } }, [song?.annotations]);
  const pageItems = annos.filter((a) => !a.page || a.page === page);
  const pageMarkers = pageItems.filter((a) => a.tool === 'marcador');
  const pageDrawings = pageItems.filter((a) => a.tool !== 'marcador');
  const pedal = useBluetoothPedal();
  const rec = useRecorder();

  // Transición miniatura → visor: avisa que la partitura ya está lista para quitar la capa superpuesta.
  useEffect(() => {
    if (!song?.id || !fullReady) return undefined;
    const t = setTimeout(() => heroReveal(song.id), 150);
    return () => clearTimeout(t);
  }, [song?.id, fullReady]);
  const leave = () => { if (singleSong && song?.id) heroOut(song.id); nav(singleSong ? '/biblioteca' : `/repertorios?abrir=${id}`); };
  // Salir con una grabación en curso (o sin subir) primero pregunta qué hacer con ella: si no, se perdería.
  const exitLive = () => { if (recorderRef.current?.requestExit(leave)) return; leave(); };
  const exitRef = useRef(exitLive);
  exitRef.current = exitLive;
  // Botón "atrás" de Android: misma salida protegida (sin esto, el sistema cerraba la pantalla y cortaba la grabación).
  useEffect(() => {
    const AppPlugin = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.App : null;
    if (!AppPlugin?.addListener) return undefined;
    let handle;
    let gone = false;
    Promise.resolve(AppPlugin.addListener('backButton', () => exitRef.current())).then((h) => { if (gone) h?.remove?.(); else handle = h; });
    return () => { gone = true; handle?.remove?.(); };
  }, []);

  const next = () => {
    if (!song) return;
    if (page < getPageCount(song)) setPage(page + 1);
    else if (index < list.length - 1) { setIndex(index + 1); setPage(1); }
    areaRef.current?.scrollTo({ top: 0 });
  };
  const prev = () => {
    if (page > 1) setPage(page - 1);
    else if (index > 0) { setIndex(index - 1); setPage(1); }
  };

  const saveAnnotations = async (json) => {
    for (let i = 0; i < 2; i++) {
      try { await saveSong({ annotations: json }, song.id); qc.invalidateQueries({ queryKey: ['song', 'full', song.id] }); return true; } catch (e) { console.error(e); if (i === 0) await new Promise((r) => setTimeout(r, 800)); }
    }
    return false;
  };
  const savePages = async (order) => {
    if (!song) return;
    if (song.page_urls?.length) {
      const newUrls = order.map((p) => song.page_urls[p - 1]).filter(Boolean);
      await saveSong({ page_urls: newUrls }, song.id);
    }
  };
  const handlePerform = () => { setEditing(false); setMenu(false); };
  // Desde el editor: si hay grabación, primero se vuelve a la vista en vivo (ahí vive el aviso) y después se pregunta.
  const handleBack = () => {
    const busy = ['recording', 'failed', 'saving'].includes(rec.state);
    setEditing(false);
    if (busy) setTimeout(() => exitRef.current(), 0); else leave();
  };

  useEffect(() => { if (editing) return; setPedalHandlers({ next, prev }); }, [index, page, song, editing]);
  useEffect(() => {
    // Pedales Bluetooth en modo teclado: según el modelo mandan ←/→, ↑/↓ o AvPag/RePág.
    const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
    const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    const key = (e) => {
      if (editing) return;
      // Escribiendo en las notas: espacio y Enter son texto, no un cambio de página.
      const t = e.target;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const isNext = NEXT_KEYS.includes(e.key), isPrev = PREV_KEYS.includes(e.key);
      if (!isNext && !isPrev) return;
      e.preventDefault();
      // Pedal mantenido apretado: el teclado repite la tecla; en vivo eso pasaría varias páginas.
      if (e.repeat) return;
      if (isNext) next(); else prev();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index, page, song, editing]);

  // Pantalla siempre encendida mientras dure el Modo En Vivo (ajuste "Mantener pantalla encendida").
  // Se vuelve a pedir al volver de una notificación o de otra app; en Android lo hace el plugin nativo.
  useEffect(() => {
    let off = false;
    try { off = localStorage.getItem('stage-wake') === 'off'; } catch { /* sin almacenamiento: queda encendida */ }
    if (off) return undefined;
    startKeepAwake();
    return () => { stopKeepAwake(); };
  }, []);

  useEffect(() => { if (rec.state === 'recording') rec.markSong(song, index); }, [index, rec.state, song]);
  useEffect(() => { if (rec.state === 'recording') rec.markPage(page); }, [page, rec.state]);
  // Guarda la última página (#12) para "Seguí donde quedaste". Espera 2 s quieto en la página y escribe directo,
  // sin recargar la lista, para no mover nada en pleno show. Si falla (sin internet), no pasa nada.
  useEffect(() => {
    if (!song?.id || song.is_demo || page === song.last_page) return undefined;
    const t = setTimeout(() => { base44.entities.Song.update(song.id, { last_page: page }).catch(() => {}); }, 2000);
    return () => clearTimeout(t);
  }, [page, song?.id]);

  useEffect(() => { setFontScale(song?.font_scale || 1); }, [song?.id]);

  useEffect(() => {
    if (!song || fontScale === (song.font_scale || 1)) return;
    if (fontSaveRef.current) clearTimeout(fontSaveRef.current);
    fontSaveRef.current = setTimeout(async () => {
      try { await saveSong({ font_scale: fontScale }, song.id); } catch (e) { console.error(e); }
    }, 800);
    return () => { if (fontSaveRef.current) clearTimeout(fontSaveRef.current); };
  }, [fontScale, song?.id]);

  const isTextScore = !song?.file_url && !song?.page_urls?.length;
  const adjustFont = (delta) => setFontScale((s) => Math.max(0.6, Math.min(2.5, +(s + delta).toFixed(2))));

  const onPressStart = (e) => {
    if (menu) return;
    clearTimeout(pressTimer.current);
    setPressSide(e.clientX < window.innerWidth / 3 ? 'prev' : 'next');
  };
  // Se apaga un instante después de soltar, para que se vea aunque el toque sea muy rápido.
  const onPressEnd = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressSide(null), 120);
  };

  // Toque en bordes: tercio izquierdo = página anterior, resto = siguiente. Instantáneo.
  const handleScreenTap = (e) => {
    if (menu) { setMenu(false); return; }
    setTapped(true);
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w / 3) prev();
    else next();
  };

  if (loading) return <div className="h-[100dvh] bg-black text-white/50 flex items-center justify-center">{tr('Preparando presentación…')}</div>;
  if (singleSong ? !slimSong : (!show && setsLoaded)) return <div className="h-[100dvh] bg-black text-white/50 flex flex-col items-center justify-center gap-4">{singleSong ? tr('Partitura no encontrada.') : tr('Repertorio no encontrado.')}<Link to={singleSong ? '/biblioteca' : '/repertorios'} className="text-[#c9ef72]">{tr('Volver')}</Link></div>;
  if (!singleSong && !setsLoaded) return <div className="h-[100dvh] bg-black text-white/50 flex items-center justify-center">{tr('Cargando repertorio…')}</div>;

  const recording = rec.state === 'recording';
  const canEdit = !!song && (song.created_by_id === user?.id) && !needsConversion(song) && fullReady;

  if (editing && song) {
    return (
      <ScoreEditor
        song={song}
        page={page}
        onPageChange={setPage}
        onSaveAnnotations={saveAnnotations}
        onSavePages={savePages}
        onPerform={handlePerform}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div
        ref={areaRef}
        onClick={handleScreenTap}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressEnd}
        onPointerLeave={onPressEnd}
        className="absolute inset-0 overflow-hidden flex justify-center"
        style={{ touchAction: 'pan-x pan-y' /* sin pellizco ni doble toque que agranden la página en pleno show; el visor tiene su propio zoom */ }}
      >
        <div className="w-full max-w-[900px] h-full relative">
          <ScorePreview song={song} page={page} zoom={fontScale} fill onContentRect={setContentRect} conversionProgress={convProgress} conversionError={convError} onRetryConversion={retryConversion} onNextSong={index < list.length - 1 ? () => { setIndex(index + 1); setPage(1); } : undefined} />
          <AnnotationCanvas items={pageDrawings} rect={contentRect} />
          <MarkerLayer markers={pageMarkers} readOnly rect={contentRect} />
        </div>
        {/* Franja tenue en el borde tocado: aparece al instante y se desvanece al soltar. */}
        <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#8e9aaf]/30 to-transparent ${pressSide === 'prev' ? 'opacity-100' : 'opacity-0 transition-opacity duration-150'}`} />
        <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#8e9aaf]/30 to-transparent ${pressSide === 'next' ? 'opacity-100' : 'opacity-0 transition-opacity duration-150'}`} />
      </div>

      <TapZoneHint dismissed={tapped} />

      {recording && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+10px)] left-3 z-30 flex items-center gap-1.5 text-[11px] font-semibold text-red-300 bg-black/40 backdrop-blur-sm rounded-full px-2.5 h-7 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {tr('REC ·')}{' '}{fmt(rec.elapsed)}
        </div>
      )}

      <div className="absolute top-[calc(env(safe-area-inset-top)+8px)] right-3 z-30 flex items-center gap-2">
        {isTextScore && (
          <div className="flex items-center gap-1 bg-black/25 backdrop-blur rounded-full p-1">
            <button onClick={(e) => { e.stopPropagation(); adjustFont(-0.1); }} className="w-8 h-8 rounded-full text-white/70 flex items-center justify-center text-sm font-bold hover:text-white">{tr('A−')}</button>
            <button onClick={(e) => { e.stopPropagation(); adjustFont(0.1); }} className="w-8 h-8 rounded-full text-white/70 flex items-center justify-center text-base font-bold hover:text-white">{tr('A+')}</button>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
          aria-label={tr('Configuración')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${menu ? 'bg-black/60 text-white' : 'bg-black/25 text-white/65 hover:text-white'}`}
        >
          <Settings size={20} />
        </button>
      </div>

      {menu && (
        <>
          <div className="absolute inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenu(false); }} />
          <div className="absolute top-[calc(env(safe-area-inset-top)+58px)] right-3 z-40 w-56 bg-[#161B26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); if (canEdit) { setEditing(true); setMenu(false); } }}
              disabled={!canEdit}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5 disabled:opacity-40"
            >
              <Pencil size={17} className="text-[#c9ef72]" />
              <span>{tr('Editar')}</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); recorderRef.current?.toggle(); setMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5"
            >
              {recording ? <Square size={17} className="text-red-400" /> : <Mic size={17} className="text-[#c9ef72]" />}
              <span>{recording ? tr('Detener grabación') : tr('Grabación')}</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={(e) => { e.stopPropagation(); setMenu(false); exitLive(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5"
            >
              <LogOut size={17} className="text-white/60" />
              <span>{tr('Salir del Modo En Vivo')}</span>
            </button>
          </div>
        </>
      )}

      <LiveRecorder ref={recorderRef} rec={rec} show={singleSong ? { name: slimSong?.title } : show} />
    </div>
  );
}