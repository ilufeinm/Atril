import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

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
      setError(e.message || 'No se pudo acceder al micrófono.');
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

  const stop = useCallback(async ({ name, type, setlist_id, setlist_name }) => {
    const rec = recRef.current;
    if (!rec) return null;
    set('saving');
    clearInterval(timerRef.current);
    const total = (Date.now() - startTsRef.current) / 1000;
    if (curRef.current) curRef.current.end = total;
    const blob = await new Promise((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }));
      try { rec.stop(); } catch (e) { resolve(new Blob(chunksRef.current, { type: 'audio/webm' })); }
    });
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([blob], `grabacion-${Date.now()}.${ext}`, { type: blob.type });
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    const songs = songsRef.current.map((s) => ({ ...s, end: s.end ?? total }));
    const created = await base44.entities.Recording.create({
      name: name || 'Grabación',
      type: type || 'performance',
      date: new Date().toISOString(),
      duration: Math.round(total),
      setlist_id: setlist_id || '',
      setlist_name: setlist_name || '',
      audio_url: file_url,
      songs: JSON.stringify(songs),
      notes: '[]'
    });
    set('idle');
    setElapsed(0);
    recRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    songsRef.current = [];
    curRef.current = null;
    return created;
  }, []);

  const cancel = useCallback(() => {
    clearInterval(timerRef.current);
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch {} }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    recRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    songsRef.current = [];
    curRef.current = null;
    set('idle');
    setElapsed(0);
  }, []);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
  }, []);

  return { state, elapsed, error, start, stop, cancel, markSong, markPage };
}