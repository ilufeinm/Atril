import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, AlertCircle, CheckCircle2, Images } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from './StageProvider';

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif'];

function validateFile(file) {
  if (!file) return 'No se seleccionó ningún archivo.';
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const okType = ACCEPTED.includes(ext) || file.type === 'application/pdf' || file.type.startsWith('image/');
  if (!okType) return `Formato no compatible. Usá ${ACCEPTED.join(', ').toUpperCase()}.`;
  if (file.size > MAX_SIZE) return 'El archivo supera los 25 MB.';
  return '';
}

export default function ImportDialog({ onClose, initialFile }) {
  const { saveSong } = useStage();
  const [form, setForm] = useState({ title: '', artist: '', key: '', bpm: '', type: 'Partitura', folder: 'Sin carpeta', tags: '' });
  const [files, setFiles] = useState(initialFile ? [initialFile] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | uploading | saving
  const inputRef = useRef(null);

  const pickFile = (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    if (list.length === 0) return;
    const valid = [];
    for (const f of list) {
      const err = validateFile(f);
      if (err) { setError(err); setFiles([]); return; }
      valid.push(f);
    }
    setError('');
    setFiles(valid);
    if (!form.title) {
      const base = valid[0].name.replace(/\.[^.]+$/, '');
      setForm((prev) => ({ ...prev, title: base }));
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const isPdf = files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf');
  const isMultiImage = files.length > 1;

  const submit = async (e) => {
    e.preventDefault();
    for (const f of files) {
      const vErr = validateFile(f);
      if (vErr) { setError(vErr); return; }
    }
    setBusy(true);
    setError('');
    try {
      let file_url = '';
      let page_urls = [];
      if (files.length === 1) {
        setPhase('uploading');
        const result = await base44.integrations.Core.UploadPrivateFile({ file: files[0] });
        file_url = result.file_uri;
      } else if (files.length > 1) {
        setPhase('uploading');
        for (const f of files) {
          const result = await base44.integrations.Core.UploadPrivateFile({ file: f });
          page_urls.push(result.file_uri);
        }
      }
      setPhase('saving');
      let saved;
      let lastErr;
      const payload = {
        ...form,
        bpm: Number(form.bpm) || 0,
        file_url,
        page_urls,
        pages: page_urls.length || 1,
        duration: 180,
      };
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          saved = await saveSong(payload);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
      if (lastErr) throw lastErr;
      onClose(saved);
    } catch (e) {
      setError(e.message || 'No se pudo importar la partitura. Intentá de nuevo.');
    } finally {
      setBusy(false);
      setPhase('idle');
    }
  };

  const phaseLabel = phase === 'uploading' ? 'Subiendo archivo(s)…' : phase === 'saving' ? 'Guardando partitura…' : 'Importando…';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1e1e22] text-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs text-[#8e9aaf] uppercase tracking-widest font-bold">BIBLIOTECA</div>
            <h2 className="text-2xl font-bold mt-1">Importar partitura</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-white/10" disabled={busy}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-white/60">Título *
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la canción" className="stage-input mt-2" disabled={busy} />
          </label>
          <label className="block text-sm text-white/60">Artista o compositor
            <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="¿De quién es?" className="stage-input mt-2" disabled={busy} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-white/60">Tonalidad
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="Ej. Sol" className="stage-input mt-2" disabled={busy} />
            </label>
            <label className="text-sm text-white/60">BPM
              <input type="number" min="1" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} placeholder="Ej. 120" className="stage-input mt-2" disabled={busy} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-white/60">Carpeta
              <input value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} className="stage-input mt-2" disabled={busy} />
            </label>
            <label className="text-sm text-white/60">Etiquetas
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Pop, Acústico" className="stage-input mt-2" disabled={busy} />
            </label>
          </div>

          <button type="button" onClick={() => inputRef.current?.click()} className="w-full flex flex-col items-center gap-2 border border-dashed border-white/25 rounded-2xl p-6 text-center cursor-pointer hover:border-[#8e9aaf] transition-colors">
            {files.length > 0 ? (
              <>
                <CheckCircle2 size={24} className="text-[#8e9aaf]" />
                <span className="text-sm font-medium">{files.length} {files.length === 1 ? 'archivo' : 'imágenes'} seleccionada{files.length === 1 ? '' : 's'}</span>
                <span className="text-xs text-white/40">Tocá para cambiar</span>
              </>
            ) : (
              <>
                <Images size={24} className="text-[#8e9aaf]" />
                <span className="text-sm font-medium">Seleccionar PDF o imágenes</span>
                <span className="text-xs text-white/40">PDF, o varias imágenes (una hoja por imagen) · máx. 25 MB · Opcional</span>
              </>
            )}
          </button>
          <input ref={inputRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={pickFile} />

          {files.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded-full pl-3 pr-1.5 h-7">
                  <span className="text-xs text-white/70 max-w-[120px] truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-300 text-sm bg-red-500/10 rounded-xl p-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button disabled={busy} className="w-full h-12 rounded-xl bg-[#8e9aaf] text-[#121212] font-bold flex items-center justify-center gap-2 disabled:opacity-70">
            {busy ? <><Loader2 className="animate-spin" size={18} /> {phaseLabel}</> : 'Guardar en biblioteca'}
          </button>
        </form>
      </div>
    </div>
  );
}