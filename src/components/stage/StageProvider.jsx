import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEMO_SONGS } from '@/lib/demoSongs';
import { buildDemoSets } from '@/lib/demoSets';
import { DEMO_BANDS } from '@/lib/demoBands';
import { markOnboardingDone } from '@/lib/onboarding';

const Context = createContext(null);
export const useStage = () => useContext(Context);

export default function StageProvider({ children }) {
  const [allSongs, setAllSongs] = useState([]);
  const [allSets, setAllSets] = useState([]);
  const [allBands, setAllBands] = useState([]);
  const [allBandSongs, setAllBandSongs] = useState([]);
  const [allBandMessages, setAllBandMessages] = useState([]);
  const [allRecordings, setAllRecordings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const [a, b, u, bands, bandSongs, bandMessages, recordings] = await Promise.all([
        base44.entities.Song.list('-updated_date'),
        base44.entities.Setlist.list('-updated_date'),
        base44.auth.me().catch(() => null),
        base44.entities.Band.list('-updated_date').catch(() => []),
        base44.entities.BandSong.list('-updated_date').catch(() => []),
        base44.entities.BandMessage.list('-updated_date').catch(() => []),
        base44.entities.Recording.list('-updated_date').catch(() => [])
      ]);
      setAllSongs(a); setAllSets(b); setUser(u);
      setAllBands(bands); setAllBandSongs(bandSongs); setAllBandMessages(bandMessages); setAllRecordings(recordings);
      setError('');
      localStorage.setItem('stage-cache', JSON.stringify({ songs: a, sets: b, ts: Date.now() }));
    } catch (e) {
      const cache = localStorage.getItem('stage-cache');
      if (cache) {
        try { const c = JSON.parse(cache); setAllSongs(c.songs || []); setAllSets(c.sets || []); setError('Sin conexión: mostrando datos guardados.'); } catch { setError(e.message); }
      } else { setError(e.message || 'No se pudieron cargar los datos.'); }
    }
  };

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  // Suscripciones en tiempo real: cada create/update/delete actualiza el estado
  // local correspondiente sin necesidad de recargar (refresh).
  useEffect(() => {
    const apply = (setter) => (event) => {
      setter((prev) => {
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
    };
    const unsubs = [
      base44.entities.Song.subscribe(apply(setAllSongs)),
      base44.entities.Setlist.subscribe(apply(setAllSets)),
      base44.entities.Band.subscribe(apply(setAllBands)),
      base44.entities.BandSong.subscribe(apply(setAllBandSongs)),
      base44.entities.BandMessage.subscribe(apply(setAllBandMessages)),
      base44.entities.Recording.subscribe(apply(setAllRecordings)),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  // Siembra partituras, repertorios y bandas de ejemplo una sola vez por cuenta.
  // Cada tipo tiene su propio flag para que se siembren de forma independiente.
  // Los repertorios demo se asocian a las bandas demo (band_id) para que aparezcan
  // en la sección Repertorio de cada banda de ejemplo.
  const seedingRef = useRef(false);
  useEffect(() => {
    // Asocia repertorios demo sueltos a bandas demo que no tengan repertorio.
    // Reutiliza los repertorios existentes sin banda y crea los que falten.
    const linkDemoSets = async (uid) => {
      const [demoBands, demoSets] = await Promise.all([
        base44.entities.Band.filter({ is_demo: true, created_by_id: uid }),
        base44.entities.Setlist.filter({ is_demo: true, created_by_id: uid })
      ]);
      const linkedBandIds = new Set(demoSets.filter((s) => s.band_id).map((s) => s.band_id));
      const bandsNeedSets = demoBands.filter((b) => !linkedBandIds.has(b.id));
      if (bandsNeedSets.length === 0) return;
      const unlinked = demoSets.filter((s) => !s.band_id);
      const toUpdate = [];
      let ui = 0;
      for (const band of bandsNeedSets) {
        if (ui < unlinked.length) { toUpdate.push({ id: unlinked[ui].id, band_id: band.id }); ui++; }
      }
      if (toUpdate.length) await base44.entities.Setlist.bulkUpdate(toUpdate);
      const remaining = bandsNeedSets.slice(ui).map((b) => ({ ...b, _idx: demoBands.indexOf(b) }));
      if (remaining.length > 0) {
        const demoSongs = await base44.entities.Song.filter({ is_demo: true, created_by_id: uid });
        await base44.entities.Setlist.bulkCreate(buildDemoSets(demoSongs.map((s) => s.id), remaining));
      }
    };

    const seed = async () => {
      if (!user || seedingRef.current) return;
      const needsSongs = !user.demo_seeded;
      const needsSets = !user.demo_sets_seeded;
      const needsBands = !user.demo_bands_seeded;
      const needsLink = user.demo_bands_seeded && user.demo_sets_seeded && !user.demo_linked;
      if (!needsSongs && !needsSets && !needsBands && !needsLink) return;

      seedingRef.current = true;
      try {
        // Partituras
        if (needsSongs) {
          const existing = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          if (existing.length === 0) await base44.entities.Song.bulkCreate(DEMO_SONGS);
        }

        // Bandas (antes que repertorios para poder asociarlos)
        if (needsBands) {
          const existingBands = await base44.entities.Band.filter({ is_demo: true, created_by_id: user.id });
          if (existingBands.length === 0) await base44.entities.Band.bulkCreate(DEMO_BANDS);
        }

        // Repertorios asociados a las bandas demo
        if (needsSets) {
          const demoSongs = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          const demoBands = await base44.entities.Band.filter({ is_demo: true, created_by_id: user.id });
          const existingSets = await base44.entities.Setlist.filter({ is_demo: true, created_by_id: user.id });
          if (existingSets.length === 0 && demoBands.length > 0) {
            await base44.entities.Setlist.bulkCreate(buildDemoSets(demoSongs.map((s) => s.id), demoBands));
          }
        }

        // Migración: asociar repertorios demo sueltos a bandas demo (cuentas existentes)
        if (needsLink) {
          await linkDemoSets(user.id);
        }

        const updates = {};
        if (needsSongs) updates.demo_seeded = true;
        if (needsSets) updates.demo_sets_seeded = true;
        if (needsBands) updates.demo_bands_seeded = true;
        if (needsLink) updates.demo_linked = true;
        await base44.auth.updateMe(updates);
        await refresh();
      } catch (e) {
        console.error('No se pudieron sembrar los ejemplos', e);
      } finally {
        seedingRef.current = false;
      }
    };
    seed();
  }, [user?.id, user?.demo_seeded, user?.demo_sets_seeded, user?.demo_bands_seeded, user?.demo_linked]);

  const uid = user?.id;
  const mySongs = allSongs.filter((s) => s.created_by_id === uid);
  const demoSets = allSets.filter((s) => s.is_demo);
  const mySets = allSets.filter((s) => !s.is_demo && s.created_by_id === uid);
  const demoDismissed = !!user?.demo_dismissed;

  const dismissDemo = async () => {
    if (!uid) return;
    try {
      await Promise.allSettled([
        base44.entities.Song.deleteMany({ is_demo: true, created_by_id: uid }),
        base44.entities.Setlist.deleteMany({ is_demo: true, created_by_id: uid }),
        base44.entities.Band.deleteMany({ is_demo: true, created_by_id: uid }),
      ]);
      const u = await base44.auth.updateMe({ demo_dismissed: true });
      setUser(u);
      await refresh();
    } catch (e) {
      console.error('No se pudieron eliminar los ejemplos', e);
    }
  };

  const completeOnboarding = async () => {
    try {
      const u = await base44.auth.updateMe({ onboarding_done: true });
      setUser(u);
    } catch (e) {
      console.error('No se pudo guardar el onboarding', e);
    }
    markOnboardingDone();
  };

  const saveSong = async (data, id) => id ? await base44.entities.Song.update(id, data) : await base44.entities.Song.create(data);
  const saveSet = async (data, id) => id ? await base44.entities.Setlist.update(id, data) : await base44.entities.Setlist.create(data);
  const deleteSong = async (id) => { await base44.entities.Song.delete(id); };
  const deleteSet = async (id) => { await base44.entities.Setlist.delete(id); };

  return     <Context.Provider value={{ user, songs: mySongs, sets: mySets, demoSets, allSongs, allSets, allBands, allBandSongs, allBandMessages, allRecordings, demoDismissed, dismissDemo, completeOnboarding, loading, error, refresh, saveSong, saveSet, deleteSong, deleteSet }}>{children}</Context.Provider>;
}