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
  const [allRecordings, setAllRecordings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flags de carga lazy: qué entidades ya se cargaron desde el servidor
  const loadedRef = useRef({ sets: false, bands: false, recordings: false });
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [bandsLoaded, setBandsLoaded] = useState(false);
  const [recordingsLoaded, setRecordingsLoaded] = useState(false);
  const [setsLoading, setSetsLoading] = useState(false);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  // Carga inicial: solo auth.me + Song (las 2 llamadas mínimas)
  const refresh = async () => {
    try {
      const [a, u] = await Promise.all([
        base44.entities.Song.list('-updated_date'),
        base44.auth.me().catch(() => null),
      ]);
      setAllSongs(a); setUser(u);
      setError('');
      localStorage.setItem('stage-cache', JSON.stringify({ songs: a, ts: Date.now() }));
    } catch (e) {
      const cache = localStorage.getItem('stage-cache');
      if (cache) {
        try { const c = JSON.parse(cache); setAllSongs(c.songs || []); setError('Sin conexión: mostrando datos guardados.'); } catch { setError(e.message); }
      } else { setError(e.message || 'No se pudieron cargar los datos.'); }
    }
  };

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  // Suscripción realtime de Song (siempre activa, es la entidad principal)
  useEffect(() => {
    const apply = (setter) => (event) => {
      setter((prev) => {
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
    };
    const unsubs = [base44.entities.Song.subscribe(apply(setAllSongs))];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  // Cargadores lazy: cada uno fetcha su entidad una sola vez y suscribe realtime
  const loadSets = async () => {
    if (loadedRef.current.sets) return;
    loadedRef.current.sets = true;
    setSetsLoading(true);
    try {
      const s = await base44.entities.Setlist.list('-updated_date');
      setAllSets(s);
      setSetsLoaded(true);
      const apply = (event) => setAllSets((prev) => {
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
      base44.entities.Setlist.subscribe(apply);
    } catch (e) { console.error(e); loadedRef.current.sets = false; }
    finally { setSetsLoading(false); }
  };

  const loadBands = async () => {
    if (loadedRef.current.bands) return;
    loadedRef.current.bands = true;
    setBandsLoading(true);
    try {
      const b = await base44.entities.Band.list('-updated_date');
      setAllBands(b);
      setBandsLoaded(true);
      const apply = (event) => setAllBands((prev) => {
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
      base44.entities.Band.subscribe(apply);
    } catch (e) { console.error(e); loadedRef.current.bands = false; }
    finally { setBandsLoading(false); }
  };

  const loadRecordings = async () => {
    if (loadedRef.current.recordings) return;
    loadedRef.current.recordings = true;
    setRecordingsLoading(true);
    try {
      const r = await base44.entities.Recording.list('-updated_date');
      setAllRecordings(r);
      setRecordingsLoaded(true);
      const apply = (event) => setAllRecordings((prev) => {
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
      base44.entities.Recording.subscribe(apply);
    } catch (e) { console.error(e); loadedRef.current.recordings = false; }
    finally { setRecordingsLoading(false); }
  };

  // Siembra partituras, repertorios y bandas de ejemplo una sola vez por cuenta.
  const seedingRef = useRef(false);
  useEffect(() => {
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
        if (needsSongs) {
          const existing = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          if (existing.length === 0) await base44.entities.Song.bulkCreate(DEMO_SONGS);
        }
        if (needsBands) {
          const existingBands = await base44.entities.Band.filter({ is_demo: true, created_by_id: user.id });
          if (existingBands.length === 0) await base44.entities.Band.bulkCreate(DEMO_BANDS);
        }
        if (needsSets) {
          const demoSongs = await base44.entities.Song.filter({ is_demo: true, created_by_id: user.id });
          const demoBands = await base44.entities.Band.filter({ is_demo: true, created_by_id: user.id });
          const existingSets = await base44.entities.Setlist.filter({ is_demo: true, created_by_id: user.id });
          if (existingSets.length === 0 && demoBands.length > 0) {
            await base44.entities.Setlist.bulkCreate(buildDemoSets(demoSongs.map((s) => s.id), demoBands));
          }
        }
        if (needsLink) { await linkDemoSets(user.id); }

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
  const demoHidden = !!user?.demo_hidden;
  const hasOwnContent = mySongs.some((s) => !s.is_demo);

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

  const hideDemos = async () => {
    try {
      const u = await base44.auth.updateMe({ demo_hidden: true });
      setUser(u);
    } catch (e) {
      console.error('No se pudieron ocultar las demos', e);
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

  return (
    <Context.Provider value={{
      user, songs: mySongs, sets: mySets, demoSets, allSongs, allSets, allBands, allRecordings,
      setsLoaded, bandsLoaded, recordingsLoaded, setsLoading, bandsLoading, recordingsLoading,
      loadSets, loadBands, loadRecordings,
      demoDismissed, demoHidden, hasOwnContent, dismissDemo, hideDemos, completeOnboarding, loading, error, refresh,
      saveSong, saveSet, deleteSong, deleteSet,
    }}>
      {children}
    </Context.Provider>
  );
}