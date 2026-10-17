import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheet from '@/components/motion/BottomSheet';
import { tr } from '@/i18n';

export default function BandScoreDialog({ bandId, setlistId, song, onClose, onSaved }) {
  const replace = !!song;
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      let file_url = song?.file_url || '';
      let pages = song?.pages || 1;
      if (file) {
        const up = await base44.integrations.Core.UploadPublicFile({ file });
        file_url = up.file_url;
      }
      if (!replace && !title.trim()) { setErr(tr('El título es obligatorio')); setBusy(false); return; }
      const res = await base44.functions.invoke('saveBandSong', {
        band_id: bandId,
        setlist_id: replace ? null : setlistId,
        song_id: replace ? song.id : null,
        title, artist, file_url, pages
      });
      onSaved?.(res.data.song); onClose();
    } catch (e) { setErr(e.response?.data?.error || e.message || tr('No se pudo guardar')); } finally { setBusy(false); }
  };

  return (
    <BottomSheet title={replace ? tr('Reemplazar partitura') : tr('Agregar canción al repertorio')} onClose={onClose} detents={[0.7, 0.94]}>
      <div className="px-5 pb-4 space-y-4">
        {!replace && <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr('Título de la canción')} className="stage-input" />}
        {!replace && <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={tr('Artista (opcional)')} className="stage-input" />}
        <div>
          <label className="text-sm text-[#8A94A8] mb-2 block">{tr('Partitura (PDF, imagen o TXT)')}</label>
          <button onClick={() => fileRef.current?.click()} className="w-full h-12 rounded-xl border border-dashed border-[#2B3448] text-sm text-[#8A94A8] flex items-center justify-center gap-2 hover:border-[#FF2E93]">
            <Upload size={17} /> {file ? file.name : (replace ? tr('Elegir nuevo archivo') : tr('Elegir archivo (opcional)'))}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button onClick={submit} disabled={busy} className="w-full h-12 rounded-full stage-grad text-white font-bold flex items-center justify-center gap-2">{busy ? <><Loader2 size={18} className="animate-spin" /> {tr('Guardando…')}</> : tr('Guardar')}</button>
      </div>
    </BottomSheet>
  );
}
