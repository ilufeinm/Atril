import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEMO_SONGS } from '@/lib/demoSongs';
import { buildDemoSets } from '@/lib/demoSets';
import { DEMO_BANDS } from '@/lib/demoBands';
import { markOnboardingDone } from '@/lib/onboarding';
import {
  useSongsQuery, useUserQuery, useSetsQuery, useBandsQuery, useRecordingsQuery,
  SONGS_KEY, USER_KEY, SETS_KEY, BANDS_KEY, RECORDINGS_KEY,
} from '@/hooks/useStageQueries';

const Context = createContext(null);
export const useStage = () => useContext(Context);

export default function StageProvider({ children }) {
  const qc = useQueryClient();
  const songsQ = useSongsQuery();
  const userQ = useUserQuery();
  const [setsEnabled, setSetsEnabled] = useState(false);
  const [bandsEnabled, setBandsEnabled] = useState(false);
  const [recordingsEnabled, setRecordingsEnabled] = useState(false);
  const setsQ = useSetsQuery(setsEnabled);
  const bandsQ = useBandsQuery(bandsEnabled);
  const recordingsQ = useRecordingsQuery(recordingsEnabled);

  const allSongs = songsQ.data || [];
  const user = userQ.data || null;
  const loading = songsQ.isLoading && !songsQ.data;
  const error = songsQ.error ? (songsQ.error.message || 'No se pudieron cargar los datos.') : '';

  // Suscripción realtime de Song (siempre activa)
  useEffect(() => {
    const apply = (event) => {
      qc.setQueryData(SONGS_KEY, (prev) => {
        if (!prev) return prev;
        if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [event.data, ...prev];
        const next = [...prev]; next[idx] = event.data; return next;
      });
      // Invalidar caché completo de la partitura afectada
      if (event.type !== 'delete') qc.invalidateQueries({ queryKey: ['song', 'full', event.id] });
    };
    const unsub = base44.entities.Song.subscribe(apply);
    return () => unsub && unsub();
  }, [qc]);

  useEffect(() => {
    if (!setsEnabled) return;
    const apply = (event) => qc.setQueryData(SETS_KEY, (prev) => {
      if (!prev) return prev;
      if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
      const idx = prev.findIndex((r) => r.id === event.id);
      if (idx === -1) return [event.data, ...prev];
      const next = [...prev]; next[idx] = event.data; return next;
    });
    const unsub = base44.entities.Setlist.subscribe(apply);
    return () => unsub && unsub();
  }, [setsEnabled, qc]);

  useEffect(() => {
    if (!bandsEnabled) return;
    const apply = (event) => qc.setQueryData(BANDS_KEY, (prev) => {
      if (!prev) return prev;
      if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
      const idx = prev.findIndex((r) => r.id === event.id);
      if (idx === -1) return [event.data, ...prev];
      const next = [...prev]; next[idx] = event.data; return next;
    });
    const unsub = base44.entities.Band.subscribe(apply);
    return () => unsub && unsub();
  }, [bandsEnabled, qc]);

  useEffect(() => {
    if (!recordingsEnabled) return;
    const apply = (event) => qc.setQueryData(RECORDINGS_KEY, (prev) => {
      if (!prev) return prev;
      if (event.type === 'delete') return prev.filter((r) => r.id !== event.id);
      const idx = prev.findIndex((r) => r.id === event.id);
      if (idx === -1) return [event.data, ...prev];
      const next = [...prev]; next[idx] = event.data; return next;
    });
    const unsub = base44.entities.Recording.subscribe(apply);
    return () => unsub && unsub();
  }, [recordingsEnabled, qc]);

  const loadSets = () => setSetsEnabled(true);
  const loadBands = () => setBandsEnabled(true);
  const loadRecordings = () => setRecordingsEnabled(true);

  const refresh = async () => {
    await Promise.all([songsQ.refetch(), userQ.refetch()]);
    if (setsEnabled) setsQ.refetch();
    if (bandsEnabled) bandsQ.refetch();
    if (recordingsEnabled) recordingsQ.refetch();
  };

  const setUser = (u) => qc.setQueryData(USER_KEY, u);

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
        const u = await base44.auth.updateMe(updates);
        setUser(u);
        await songsQ.refetch();
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
  const allSets = setsQ.data || [];
  const demoSets = allSets.filter((s) => s.is_demo);
  const mySets = allSets.filter((s) => !s.is_demo && s.created_by_id === uid);
  const allBands = bandsQ.data || [];
  const allRecordings = recordingsQ.data || [];
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

  const saveSong = async (data, id) => {
    const r = id ? await base44.entities.Song.update(id, data) : await base44.entities.Song.create(data);
    qc.invalidateQueries({ queryKey: ['song', 'full', id] });
    return r;
  };
  const saveSet = async (data, id) => id ? await base44.entities.Setlist.update(id, data) : await base44.entities.Setlist.create(data);
  const deleteSong = async (id) => { await base44.entities.Song.delete(id); qc.invalidateQueries({ queryKey: ['song', 'full', id] }); };
  const deleteSet = async (id) => { await base44.entities.Setlist.delete(id); };

  return (
    <Context.Provider value={{
      user, songs: mySongs, sets: mySets, demoSets, allSongs, allSets, allBands, allRecordings,
      setsLoaded: !!setsQ.data, bandsLoaded: !!bandsQ.data, recordingsLoaded: !!recordingsQ.data,
      setsLoading: setsEnabled && setsQ.isLoading, bandsLoading: bandsEnabled && bandsQ.isLoading, recordingsLoading: recordingsEnabled && recordingsQ.isLoading,
      loadSets, loadBands, loadRecordings,
      demoDismissed, demoHidden, hasOwnContent, dismissDemo, hideDemos, completeOnboarding, loading, error, refresh,
      saveSong, saveSet, deleteSong, deleteSet,
    }}>
      {children}
    </Context.Provider>
  );
}