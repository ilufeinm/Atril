import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isPremium } from '@/lib/subscription';
import PremiumRecording from './PremiumRecording';

const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const defaultName = (show, type) => `${show?.name || (type === 'rehearsal' ? 'Ensayo' : 'Performance')} — ${new Date().toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}`;

export default function RecordingControl({ rec, show }) {
  const [user, setUser] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [type, setType] = useState('performance');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const premium = isPremium(user);

  const onClick = () => {
    if (rec.state === 'saving') return;
    if (rec.state === 'recording') { setName(defaultName(show, type)); setDialog('finalize'); return; }
    if (!premium) { setDialog('premium'); return; }
    setDialog('start');
  };

  const startRec = async (t) => { setType(t); setDialog(null); await rec.start(); };

  const finish = async () => {
    setSaving(true);
    try {
      const c = await rec.stop({ name: name || defaultName(show, type), type, setlist_id: show?.id, setlist_name: show?.name });
      setSaving(false);
      setDialog(null);
      if (c) nav(`/grabaciones/${c.id}`);
    } catch (e) {
      setSaving(false);
    }
  };

  const discard = () => { rec.cancel(); setDialog(null); };

  const recording = rec.state === 'recording';
  return (
    <>
      <div className="flex items-center gap-2">
        {recording && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-300 bg-red-500/15 rounded-full px-2.5 h-7">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Grabando · {fmt(rec.elapsed)}
          </span>
        )}
        <button onClick={onClick} aria-label={recording ? 'Finalizar grabación' : 'Grabar'} className={`p-2 rounded-lg ${recording ? 'text-red-400' : 'text-white/70 hover:text-white'}`}>
          {recording ? <Square size={18} /> : <Mic size={20} />}
        </button>
      </div>

      {dialog === 'start' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">¿Comenzar grabación?</h2>
              <button onClick={() => setDialog(null)} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <p className="text-sm text-white/50 mb-5">StageBook usará el micrófono para grabar tu audio y registrar automáticamente las canciones y páginas que toques. La grabación sigue aunque cambies de canción o pantalla.</p>
            <div className="space-y-2.5">
              <button onClick={() => startRec('performance')} className="w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center justify-center gap-2"><Mic size={18} /> Grabar performance</button>
              <button onClick={() => startRec('rehearsal')} className="w-full h-12 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2"><Mic size={18} /> Grabar ensayo</button>
              <button onClick={() => setDialog(null)} className="w-full h-12 rounded-xl text-white/50 font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'finalize' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="text-xl font-bold">Performance guardada</h2>
            <p className="text-sm text-white/50 mt-1">Duración · {fmt(rec.elapsed)}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} className="stage-input mt-5 text-center" placeholder={defaultName(show, type)} />
            <div className="flex gap-3 mt-6">
              <button onClick={discard} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Eliminar</button>
              <button onClick={finish} disabled={saving} className="flex-1 h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'premium' && <PremiumRecording onClose={() => setDialog(null)} />}
    </>
  );
}