import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEMO_SONGS } from '@/lib/demoSongs';
import { buildDemoSets } from '@/lib/demoSets';
import { DEMO_BANDS } from '@/lib/demoBands';

const Context = createContext(null);
export const useStage = () => useContext(Context);

export default function StageProvider({ children }) {
  const [allSongs, setAllSongs] = useState([]);
  const [allSets, setAllSets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const [a, b, u] = await Promise.all([
        base44.entities.Song.list('-updated_date'),
        base44.entities.Setlist.list('-updated_date'),
        base44.auth.me().catch(() => null)
      ]);
      setAllSongs(a); setAllSets(b); setUser(u); setError('');
      localStorage.setItem('stage-cache', JSON.stringify({ songs: a, sets: b, ts: Date.now() }));
    } catch (e) {
      const cache = localStorage.getItem('stage-cache');
      if (cache) {
        try { const c = JSON.parse(cache); setAllSongs(c.songs || []); setAllSets(c.sets || []); setError('Sin conexión: mostrando datos guardados.'); } catch { setError(e.message); }
      } else { setError(e.message || 'No se pudieron cargar los datos.'); }
    }
  };

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  // Siembra partituras, repertorios y bandas de ejemplo una sola vez por cuenta.
  // Cada tipo tiene su propio flag para que se siembren de forma independiente.
  const seedingRef = useRef(false);
  useEffect(() => {
    const seed = async () => {
      if (!user || seedingRef.current) return;
      const needsSongs = !user.demo_seeded;
      const needsSets = !user.demo_sets_seeded;
      const needsBands = !user.demo_bands_seeded;
      if (!needsSongs && !needsSets && !needsBands) return;

      seedingRef.current = true;
      try {
        // Partituras
        if (needsSongs) {
          const existing = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          if (existing.length === 0) await base44.entities.Song.bulkCreate(DEMO_SONGS);
        }

        // Repertorios (necesitan los IDs de las partituras demo)
        if (needsSets) {
          const demoSongs = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          const existingSets = await base44.entities.Setlist.filter({ is_demo: true, created_by_id: user.id });
          if (existingSets.length === 0) {
            await base44.entities.Setlist.bulkCreate(buildDemoSets(demoSongs.map((s) => s.id)));
          }
        }

        // Bandas
        if (needsBands) {
          const existingBands = await base44.entities.Band.filter({ is_demo: true, created_by_id: user.id });
          if (existingBands.length === 0) await base44.entities.Band.bulkCreate(DEMO_BANDS);
        }

        const updates = {};
        if (needsSongs) updates.demo_seeded = true;
        if (needsSets) updates.demo_sets_seeded = true;
        if (needsBands) updates.demo_bands_seeded = true;
        await base44.auth.updateMe(updates);
        await refresh();
      } catch (e) {
        console.error('No se pudieron sembrar los ejemplos', e);
      } finally {
        seedingRef.current = false;
      }
    };
    seed();
  }, [user?.id, user?.demo_seeded, user?.demo_sets_seeded, user?.demo_bands_seeded]);

  const uid = user?.id;
  const mySongs = allSongs.filter((s) => s.created_by_id === uid);
  const demoSets = allSets.filter((s) => s.is_demo);
  const mySets = allSets.filter((s) => !s.is_demo && s.created_by_id === uid);
  const demoDismissed = !!user?.demo_dismissed;

  const dismissDemo = async () => {
    try { const u = await base44.auth.updateMe({ demo_dismissed: true }); setUser(u); }
    catch (e) { console.error(e); }
  };

  const saveSong = async (data, id) => { const result = id ? await base44.entities.Song.update(id, data) : await base44.entities.Song.create(data); await refresh(); return result; };
  const saveSet = async (data, id) => { const result = id ? await base44.entities.Setlist.update(id, data) : await base44.entities.Setlist.create(data); await refresh(); return result; };
  const deleteSong = async (id) => { await base44.entities.Song.delete(id); await refresh(); };
  const deleteSet = async (id) => { await base44.entities.Setlist.delete(id); await refresh(); };

  return <Context.Provider value={{ user, songs: mySongs, sets: mySets, demoSets, allSongs, allSets, demoDismissed, dismissDemo, loading, error, refresh, saveSong, saveSet, deleteSong, deleteSet }}>{children}</Context.Provider>;
}