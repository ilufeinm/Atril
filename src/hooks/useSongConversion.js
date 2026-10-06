import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { convertSongPages } from '@/lib/scoreConvert';
import { needsConversion } from '@/lib/songPages';
import { SONGS_KEY } from '@/hooks/useStageQueries';

// Dispara la conversión en segundo plano de una partitura que aún no tiene
// páginas optimizadas. Expone el progreso y el error para mostrarlos en el visor.
export function useSongConversion(song) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(null); // { done, total }
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const runningRef = useRef(false);

  const needs = song ? needsConversion(song) : false;
  const songId = song?.id;

  const run = useCallback(() => {
    if (!songId || !needs) return;
    let cancelled = false;
    runningRef.current = true;
    setProgress({ done: 0, total: 0 });
    setError(null);
    (async () => {
      try {
        await convertSongPages({ ...song }, {
          onProgress: (done, total) => { if (!cancelled) setProgress({ done, total }); },
        });
        if (cancelled) return;
        // Actualizar caché: listado liviano y registro completo.
        qc.invalidateQueries({ queryKey: SONGS_KEY });
        qc.invalidateQueries({ queryKey: ['song', 'full', songId] });
        setProgress(null);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || 'No se pudo preparar la partitura.');
      } finally {
        if (!cancelled) runningRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [songId, needs, song, qc]);

  useEffect(() => {
    if (!needs) { setProgress(null); setError(null); return; }
    return run();
  }, [songId, needs, attempt]);

  const retry = useCallback(() => { setError(null); setAttempt((a) => a + 1); }, []);

  return { progress, error, retry };
}