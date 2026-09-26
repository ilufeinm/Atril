import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const Context = createContext(null);
export const useStage = () => useContext(Context);

export default function StageProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const [a, b] = await Promise.all([base44.entities.Song.list('-updated_date'), base44.entities.Setlist.list('-updated_date')]);
      setSongs(a); setSets(b); setError('');
      localStorage.setItem('stage-cache', JSON.stringify({ songs: a, sets: b, ts: Date.now() }));
    } catch (e) {
      const cache = localStorage.getItem('stage-cache');
      if (cache) {
        try { const c = JSON.parse(cache); setSongs(c.songs || []); setSets(c.sets || []); setError('Sin conexión: mostrando datos guardados.'); } catch { setError(e.message); }
      } else { setError(e.message || 'No se pudieron cargar los datos.'); }
    }
  };

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  const saveSong = async (data, id) => { const result = id ? await base44.entities.Song.update(id, data) : await base44.entities.Song.create(data); await refresh(); return result; };
  const saveSet = async (data, id) => { const result = id ? await base44.entities.Setlist.update(id, data) : await base44.entities.Setlist.create(data); await refresh(); return result; };
  const deleteSong = async (id) => { await base44.entities.Song.delete(id); await refresh(); };
  const deleteSet = async (id) => { await base44.entities.Setlist.delete(id); await refresh(); };

  return <Context.Provider value={{ songs, sets, loading, error, refresh, saveSong, saveSet, deleteSong, deleteSet }}>{children}</Context.Provider>;
}