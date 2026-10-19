import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { tr } from '@/i18n';

export function useRecorder() {
  const [state, setState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const stateRef = useRef('idle');
  const set = (s) => { stateRef.current = s; setState(s); };
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const startTsRef = useRef(0);
  const timerRef = useRef(null);
  const songsRef = useRef([]);
  const curRef = useRef(null);

  const tick = () => setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000));

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recRef.current = rec;
      streamRef.current = stream;
      songsRef.current = [];
      curRef.current = null;
      startTsRef.current = Date.now();
      setElapsed(0);
      rec.start(1000);
      set('recording');
      timerRef.current = setInterval(tick, 1000);
    } catch (e) {
      setError(e.message || tr('No se pudo acceder al micrófono.'));
      set('idle');
    }
  }, []);

  const markSong = useCallback((song, index) => {
    if (stateRef.current !== 'recording' || !song) return;
    const t = (Date.now() - startTsRef.current) / 1000;
    if (curRef.current) curRef.current.end = t;
    const entry = { song_id: song.id, title: song.title, index, start: t, end: null, pages: [] };
    curRef.current = entry;
    songsRef.current.push(entry);
  }, []);

  const markPage = useCallback((page) => {
    if (stateRef.current !== 'recording' || !curRef.current) return;
    const t = (Date.now() - startTsRef.current) / 1000;
    curRef.current.pages.push({ page, t });
  }, []);

  // Audio ya cortado y listo para subir. Se conserva hasta que la subida termine bien, así un fallo de
  // conexión al final del show no pierde la grabación: se puede reintentar o guardar el archivo.
  const takenRef = useRef(null); // { blob, total, startedAt }

  const reset = () => {
    recRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    songsRef.current = [];
    curRef.current = null;
    takenRef.current = null;
    setElapsed(0);
  };

  // Corta el micrófono y arma el audio (una sola vez: en un reintento se reusa el mismo).
  const take = async () => {
    if (takenRef.current) return takenRef.current;
    const rec = recRef.current;
    if (!rec) return null;
    clearInterval(timerRef.current);
    const total = (Date.now() - startTsRef.current) / 1000;
    if (curRef.current) curRef.current.end = total;
    const blob = await new Promise((resolve) => {
      const build = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }));
      if (rec.state === 'inactive') { build(); return; }
      rec.onstop = build;
      try { rec.stop(); } catch (e) { build(); }
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    takenRef.current = { blob, total, startedAt: startTsRef.current };
    return takenRef.current;
  };

  // state: 'idle' | 'recording' | 'saving' | 'failed' (no se pudo subir; el audio sigue en memoria).
  const stop = useCallback(async ({ name, type, setlist_id, setlist_name }) => {
    if (stateRef.current === 'saving') return null;
    set('saving');
    const taken = await take();
    if (!taken) { set('idle'); return null; }
    const { blob, total } = taken;
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `grabacion-${Date.now()}.${ext}`, { type: blob.type });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const songs = songsRef.current.map((s) => ({ ...s, end: s.end ?? total }));
      const created = await base44.entities.Recording.create({
        name: name || tr('Grabación'),
        type: type || 'performance',
        date: new Date(taken.startedAt).toISOString(),
        duration: Math.round(total),
        setlist_id: setlist_id || '',
        setlist_name: setlist_name || '',
        audio_url: file_uri,
        songs: JSON.stringify(songs),
        notes: '[]'
      });
      set('idle');
      reset();
      return created;
    } catch (e) {
      set('failed');
      throw e;
    }
  }, []);

  // Descarga el audio como archivo, para no perderlo si no se puede subir.
  const download = useCallback(async (name) => {
    const taken = await take();
    if (!taken) return false;
    const ext = taken.blob.type.includes('mp4') ? 'm4a' : 'webm';
    const safe = (name || tr('Grabación')).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'grabacion';
    const file = new File([taken.blob], `${safe}.${ext}`, { type: taken.blob.type });
    // En el celular, el menú de compartir permite guardarlo en Archivos o mandarlo; si no está, se descarga.
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: safe }); return true; } catch (e) { if (e?.name === 'AbortError') return false; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  }, []);

  const cancel = useCallback(() => {
    clearInterval(timerRef.current);
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch {} }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    reset();
    set('idle');
  }, []);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return { state, elapsed, error, start, stop, cancel, download, markSong, markPage };
}