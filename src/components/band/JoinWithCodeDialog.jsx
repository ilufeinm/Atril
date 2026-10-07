import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { INSTRUMENTS } from '@/components/band/instruments';
import MobileSelect from '@/components/stage/MobileSelect';

// Extrae el código de un input: acepta "IMA3AQ" o "https://scorebook.app/join/IMA3AQ"
function extractCode(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/join\/([A-Za-z0-9]+)/);
  if (match) return match[1];
  return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function JoinWithCodeDialog({ onClose }) {
  const nav = useNavigate();
  const [input, setInput] = useState('');
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [instrument, setInstrument] = useState('Guitarra');

  const lookup = async () => {
    const code = extractCode(input);
    if (!code) { setError('Ingresá un código o enlace de invitación.'); return; }
    setLoading(true); setError(''); setBand(null);
    try {
      const res = await base44.functions.invoke('getBandByInvite', { invite_code: code });
      setBand(res.data.band);
    } catch (e) {
      setError('El código no existe o no es válido.');
    } finally { setLoading(false); }
  };

  const join = async () => {
    const code = extractCode(input);
    setJoining(true);
    try {
      const res = await base44.functions.invoke('joinBand', { invite_code: code, instrument });
      const b = res.data.band;
      const dest = b?.live_setlist_id ? `/modo-banda/${b.id}/show/${b.live_setlist_id}` : `/modo-banda/${b.id}`;
      onClose();
      nav(dest);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'No se pudo unir a la banda.');
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1e1e22] rounded-3xl w-full max-w-md overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold">Unirme con código</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-white/50"><X size={20} /></button>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-white/45">Pegá el código de invitación (ej. IMA3AQ) o el enlace completo.</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !band) lookup(); }}
            placeholder="IMA3AQ o https://scorebook.app/join/IMA3AQ"
            className="stage-input"
            autoFocus
          />
          {error && <div className="flex items-center gap-2 text-sm text-red-300"><AlertCircle size={15} /> {error}</div>}
          {!band && !loading && (
            <button onClick={lookup} disabled={!input.trim()} className="h-12 rounded-xl bg-[#8e9aaf] text-white font-bold w-full">Buscar banda</button>
          )}
          {loading && <div className="flex items-center justify-center py-3"><Loader2 size={20} className="animate-spin text-white/50" /></div>}
          {band && (
            <div className="space-y-4">
              <div className="bg-[#242831] rounded-2xl p-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center text-2xl font-bold mx-auto">{band.name[0]}</div>
                <div className="font-bold mt-3">{band.name}</div>
                {band.is_member
                  ? <div className="text-xs text-[#8e9aaf] mt-1">Ya sos integrante de esta banda</div>
                  : (band.setlist && <div className="text-xs text-white/40 mt-1">{band.setlist.name} · {band.setlist.songs?.length || 0} canciones</div>)}
              </div>
              {band.is_member ? (
                <button onClick={() => { onClose(); nav(`/modo-banda/${band.band_id}`); }} className="h-12 rounded-xl bg-[#8e9aaf] text-white font-bold w-full">Entrar a la banda</button>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Tu instrumento</label>
                    <MobileSelect label="Tu instrumento" value={instrument} onChange={setInstrument} options={INSTRUMENTS.map((x) => ({ value: x.value, label: x.value, emoji: x.emoji }))} className="w-full h-12" />
                  </div>
                  <button onClick={join} disabled={joining} className="h-12 rounded-xl bg-[#8e9aaf] text-white font-bold w-full">{joining ? 'Uniéndose...' : 'Unirme a la banda'}</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}