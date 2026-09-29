import React, { useState, useRef } from 'react';
import { Download, Upload, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BackupPanel() {
  const [busy, setBusy] = useState('');
  const [done, setDone] = useState('');
  const fileRef = useRef(null);

  const exportData = async () => {
    setBusy('export'); setDone('');
    try {
      const [songs, sets] = await Promise.all([base44.entities.Song.list('-updated_date'), base44.entities.Setlist.list('-updated_date')]);
      const data = { version: 1, exported: new Date().toISOString(), songs, sets };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `scorebook-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
      setDone('Copia descargada correctamente.');
    } catch (e) { setDone('No se pudo exportar: ' + e.message); } finally { setBusy(''); }
  };

  const restore = async (file) => {
    setBusy('restore'); setDone('');
    try {
      const data = JSON.parse(await file.text());
      const strip = (r) => { const { id, created_date, updated_date, created_by_id, ...rest } = r; return rest; };
      if (Array.isArray(data.songs)) await base44.entities.Song.bulkCreate(data.songs.map(strip));
      if (Array.isArray(data.sets)) await base44.entities.Setlist.bulkCreate(data.sets.map(strip));
      setDone('Datos restaurados. Recargá la app para verlos.');
    } catch (e) { setDone('No se pudo restaurar: ' + e.message); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-3">
      <button onClick={exportData} disabled={!!busy} className="w-full h-11 px-4 rounded-xl bg-white/10 text-sm flex items-center gap-2 hover:bg-white/15 disabled:opacity-50">{busy === 'export' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Descargar copia de seguridad</button>
      <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="w-full h-11 px-4 rounded-xl bg-white/10 text-sm flex items-center gap-2 hover:bg-white/15 disabled:opacity-50">{busy === 'restore' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Restaurar desde archivo</button>
      <input type="file" accept="application/json" ref={fileRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) restore(e.target.files[0]); }} />
      {done && <p className="text-xs text-[#c9ef72] flex items-center gap-1.5"><Check size={14} /> {done}</p>}
      <p className="text-xs text-white/35">La copia incluye tus partituras, repertorios y anotaciones. Guardá el archivo en un lugar seguro.</p>
    </div>
  );
}