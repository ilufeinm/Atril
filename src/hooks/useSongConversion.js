import { useEffect, useState } from 'react';
import { convertSongPages } from '@/lib/scoreConvert';
import { needsConversion } from '@/lib/songPages';

// Dispara la conversión en segundo plano de una partitura que aún no tiene
// páginas optimizadas. Expone el progreso y el error para mostrarlos en el visor.
export function useSongConversion(song) {
  const [progress, setProgress] = useState(null); // { done, total }
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!song || !needsConversion(song)) return;
    let cancelled = false;
    setProgress({ done: 0, total: 0 });
    setError(null);
    (async () => {
      try {
        await convertSongPages(song, {
          onProgress: (done, total) => { if (!cancelled) setProgress({ done, total }); },
        });
      } catch (e) {
        if (!cancelled) setError(e.message || 'No se pudo preparar la partitura.');
      }
    })();
    return () => { cancelled = true; };
  }, [song?.id, needsConversion(song)]);

  return { progress, error };
}