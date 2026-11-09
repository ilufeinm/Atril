import React, { useState, useRef } from 'react';
import { Download, Upload, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { tr } from '@/i18n';
import { useStage } from '@/components/stage/StageProvider';
import { isNativeApp, saveFileNative, DEVICE_FOLDER } from '@/lib/nativeFiles';
import { songsToRestore, songIdMap, setsToRestore, stripRow } from '@/lib/backupRestore';

export default function BackupPanel() {
  const [busy, setBusy] = useState('');
  // Resultado de la última acción: { ok, text }. Un error no se muestra con tilde verde.
  const [done, setDone] = useState(null);
  const ok = (text) => setDone({ ok: true, text });
  const fail = (text) => setDone({ ok: false, text });
  const fileRef = useRef(null);
  const { refresh } = useStage();

  // Solo lo propio: una cuenta admin puede leer filas de otros (reglas de Supabase).
  const ownRows = async () => {
    const me = await base44.auth.me();
    const [songs, sets] = await Promise.all([base44.entities.Song.list('-updated_date'), base44.entities.Setlist.list('-updated_date')]);
    const mine = (r) => r.created_by_id === me?.id;
    return { songs: songs.filter(mine), sets: sets.filter(mine) };
  };

  const exportData = async () => {
    setBusy('export'); setDone(null);
    try {
      const { songs, sets } = await ownRows();
      const data = { version: 1, exported: new Date().toISOString(), songs, sets };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const filename = `atril-backup-${new Date().toISOString().slice(0, 10)}.json`;
      // En la app de Android no hay descargas: se guarda en Documents/Atril (o se elige dónde con el menú de compartir).
      if (isNativeApp()) {
        const where = await saveFileNative(blob, filename, { title: tr('Copia de seguridad de Atril') });
        if (where === 'device') ok(tr('Copia guardada en el teléfono, en la carpeta {{folder}}.', { folder: DEVICE_FOLDER }));
        else if (where === 'shared') ok(tr('Copia lista: la mandaste a otra app.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      ok(tr('Copia descargada correctamente.'));
    } catch (e) { fail(tr('No se pudo exportar: ') + e.message); } finally { setBusy(''); }
  };

  // Restaurar no duplica: lo que ya está en la cuenta (mismo título y archivo, o mismo repertorio y fecha) se saltea.
  const restore = async (file) => {
    setBusy('restore'); setDone(null);
    try {
      const data = JSON.parse(await file.text());
      const current = await ownRows();
      const backupSongs = Array.isArray(data.songs) ? data.songs : [];
      const backupSets = Array.isArray(data.sets) ? data.sets : [];
      const newSongs = songsToRestore(backupSongs, current.songs);
      const created = newSongs.length ? await base44.entities.Song.bulkCreate(newSongs.map(stripRow)) : [];
      const idMap = songIdMap(backupSongs, current.songs, created);
      const newSets = setsToRestore(backupSets, current.sets, idMap);
      if (newSets.length) await base44.entities.Setlist.bulkCreate(newSets);
      await refresh?.();
      ok(newSongs.length || newSets.length
        ? tr('Listo: se restauraron {{songs}} partituras y {{sets}} repertorios. Lo que ya tenías no se duplicó.', { songs: newSongs.length, sets: newSets.length })
        : tr('Ya tenías todo lo de esta copia: no hizo falta restaurar nada.'));
    } catch (e) { fail(tr('No se pudo restaurar: ') + e.message); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-3">
      <button onClick={exportData} disabled={!!busy} className="w-full h-11 px-4 rounded-full bg-white/[.12] text-sm font-semibold flex items-center gap-2 hover:bg-white/[.16] disabled:opacity-50">{busy === 'export' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {tr('Guardar copia de seguridad')}</button>
      <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="w-full h-11 px-4 rounded-full bg-white/[.12] text-sm font-semibold flex items-center gap-2 hover:bg-white/[.16] disabled:opacity-50">{busy === 'restore' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {tr('Restaurar desde archivo')}</button>
      <input type="file" accept="application/json" ref={fileRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) restore(e.target.files[0]); e.target.value = ''; }} />
      {done && (done.ok
        ? <p role="status" className="text-xs text-[#c9ef72] flex items-center gap-1.5"><Check size={14} className="shrink-0" /> {done.text}</p>
        : <p role="alert" className="text-xs text-red-300">{done.text}</p>)}
      <p className="text-xs text-white/60">{tr('La copia guarda tus repertorios y los datos de cada partitura (título, tono, anotaciones). Los archivos PDF e imágenes no van en la copia: siguen guardados en tu cuenta.')}</p>
    </div>
  );
}
