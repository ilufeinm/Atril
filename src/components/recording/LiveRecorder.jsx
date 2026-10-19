import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, X, CloudOff, Download, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isPremium } from '@/lib/subscription';
import PremiumRecording from './PremiumRecording';
import { tr, dateLocale } from '@/i18n';

const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// "58 min" o "40 s": para decir cuánto se perdería al descartar.
const amount = (s) => (s >= 60 ? tr('{{n}} min', { n: Math.round(s / 60) }) : tr('{{n}} s', { n: Math.max(1, Math.round(s)) }));
const defaultName = (show, type) => `${show?.name || (type === 'rehearsal' ? tr('Ensayo') : tr('Performance'))} — ${new Date().toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short', year: 'numeric' })}`;

// Grabación para el Modo En Vivo: sin botón visible, se activa desde el menú mediante ref.toggle().
// Guardar es el camino principal; descartar pide confirmación; si la subida falla, el audio no se pierde
// (se puede reintentar o guardar el archivo en el teléfono); salir grabando avisa antes (ref.requestExit).
const LiveRecorder = forwardRef(({ rec, show }, ref) => {
  const [user, setUser] = useState(null);
  const [dialog, setDialog] = useState(null); // 'start' | 'finalize' | 'exit' | 'premium'
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [type, setType] = useState('performance');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const exitRef = useRef(null); // acción de salida pendiente: se ejecuta cuando la grabación quedó guardada
  const nav = useNavigate();
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const premium = isPremium(user);
  const failed = rec.state === 'failed';

  const openFinalize = () => {
    if (!name) setName(defaultName(show, type));
    setConfirmDiscard(false);
    setDialog('finalize');
  };

  useImperativeHandle(ref, () => ({
    toggle: () => {
      if (rec.state === 'saving') return;
      if (rec.state === 'recording' || rec.state === 'failed') { openFinalize(); return; }
      if (!premium) { setDialog('premium'); return; }
      setDialog('start');
    },
    // Devuelve true si se encargó de la salida (había una grabación en curso o sin subir).
    requestExit: (onExit) => {
      if (rec.state !== 'recording' && rec.state !== 'failed' && rec.state !== 'saving') return false;
      exitRef.current = onExit;
      if (rec.state === 'failed') openFinalize(); else if (rec.state !== 'saving') setDialog('exit');
      return true;
    }
  }), [rec.state, premium, show, type, name]);

  const startRec = async (t) => { setType(t); setName(''); setDownloaded(false); setDialog(null); await rec.start(); };

  const finish = async () => {
    setSaving(true);
    try {
      const c = await rec.stop({ name: name || defaultName(show, type), type, setlist_id: show?.id, setlist_name: show?.name });
      setSaving(false);
      setDialog(null);
      setName('');
      setDownloaded(false);
      const onExit = exitRef.current;
      exitRef.current = null;
      if (onExit) onExit();
      else if (c) nav(`/grabaciones/${c.id}`);
    } catch {
      // La subida falló: el audio sigue en memoria (rec.state === 'failed'). Se muestra el error en el cartel.
      setSaving(false);
      setDialog('finalize');
    }
  };

  const saveAndExit = () => { if (!name) setName(defaultName(show, type)); finish(); };
  const keepPlaying = () => { exitRef.current = null; setDialog(null); };

  const discard = () => {
    rec.cancel();
    setDialog(null);
    setConfirmDiscard(false);
    setName('');
    setDownloaded(false);
    const onExit = exitRef.current;
    exitRef.current = null;
    if (onExit) onExit();
  };

  const saveFile = async () => {
    const ok = await rec.download(name || defaultName(show, type));
    if (ok) setDownloaded(true);
  };

  // Cerrar el cartel con un toque afuera solo si no hay nada en juego (grabando sigue grabando).
  const closeFinalize = () => { if (!saving) { setDialog(null); setConfirmDiscard(false); } };

  return (
    <>
      {dialog === 'start' && (
        <div className="anim-backdrop fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="bg-[#161B26] rounded-3xl p-7 w-full max-w-sm border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{tr('¿Comenzar grabación?')}</h2>
              <button onClick={() => setDialog(null)} aria-label={tr('Cerrar')}><X size={20} /></button>
            </div>
            <p className="text-sm text-white/50 mb-5">{tr('Atril usará el micrófono para grabar tu audio y registrar automáticamente las canciones y páginas que toques. La grabación sigue aunque cambies de página.')}</p>
            <div className="space-y-2.5">
              <button onClick={() => startRec('performance')} className="w-full h-12 rounded-xl stage-grad text-white font-bold flex items-center justify-center gap-2"><Mic size={18} /> {tr('Grabar performance')}</button>
              <button onClick={() => startRec('rehearsal')} className="w-full h-12 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2"><Mic size={18} /> {tr('Grabar ensayo')}</button>
              <button onClick={() => setDialog(null)} className="w-full h-12 rounded-xl text-white/50 font-medium">{tr('Cancelar')}</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'finalize' && !confirmDiscard && (
        <div className="anim-backdrop fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && closeFinalize()}>
          <div role="dialog" aria-modal="true" aria-labelledby="rec-final-title" className="bg-[#161B26] rounded-3xl p-6 w-full max-w-sm border border-white/10">
            <h2 id="rec-final-title" className="text-xl font-bold">{failed ? tr('No se pudo subir la grabación') : tr('¿Guardar la grabación?')}</h2>
            <p className="text-sm text-white/60 mt-1 tabular-nums">{tr('Duración ·')}{' '}{fmt(rec.elapsed)}</p>

            {failed && (
              <div role="alert" className="mt-4 flex gap-2.5 rounded-2xl bg-white/[.06] border border-white/10 p-3 text-sm text-white/80">
                <CloudOff size={18} className="shrink-0 mt-0.5 text-white/70" aria-hidden="true" />
                <span>{downloaded ? tr('El archivo quedó guardado. Si vuelve la conexión, también podés subirlo a Atril.') : tr('La grabación sigue en el teléfono. Reintentá cuando tengas conexión o guardá el archivo para no perderlo.')}</span>
              </div>
            )}

            <label className="block mt-4 text-xs text-white/60">{tr('Nombre')}
              <input value={name} onChange={(e) => setName(e.target.value)} className="stage-input mt-1.5" placeholder={defaultName(show, type)} disabled={saving} />
            </label>

            <div className="mt-5 space-y-2.5">
              <button onClick={finish} disabled={saving} className="w-full h-12 rounded-full bg-[#F4F5F8] text-[#121212] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {failed && !saving && <RotateCw size={16} aria-hidden="true" />}
                {saving ? tr('Guardando…') : failed ? tr('Reintentar') : tr('Guardar grabación')}
              </button>
              {failed && (
                <button onClick={saveFile} disabled={saving} className="w-full h-12 rounded-full bg-white/10 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  <Download size={16} aria-hidden="true" /> {tr('Guardar el audio en el teléfono')}
                </button>
              )}
              <button onClick={() => setConfirmDiscard(true)} disabled={saving} className="w-full h-11 text-sm font-medium text-white/60 disabled:opacity-40">{tr('Descartar')}</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'finalize' && confirmDiscard && (
        <div className="anim-backdrop fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="rec-discard-title" className="bg-[#161B26] rounded-3xl p-6 w-full max-w-sm border border-white/10">
            <h2 id="rec-discard-title" className="text-xl font-bold">{tr('¿Descartar {{amount}} de grabación?', { amount: amount(rec.elapsed) })}</h2>
            <p className="text-sm text-white/60 mt-1.5">{downloaded ? tr('Se borra de Atril. El archivo que guardaste en el teléfono no se toca.') : tr('No se puede recuperar.')}</p>
            <div className="mt-5 space-y-2.5">
              <button onClick={discard} className="w-full h-12 rounded-full bg-red-500 text-white font-bold">{tr('Descartar grabación')}</button>
              <button onClick={() => setConfirmDiscard(false)} className="w-full h-12 rounded-full bg-white/10 text-white font-semibold">{tr('Volver')}</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'exit' && (
        <div className="anim-backdrop fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !saving && keepPlaying()}>
          <div role="dialog" aria-modal="true" aria-labelledby="rec-exit-title" className="bg-[#161B26] rounded-3xl p-6 w-full max-w-sm border border-white/10">
            <h2 id="rec-exit-title" className="text-xl font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />{tr('Estás grabando')}</h2>
            <p className="text-sm text-white/60 mt-1.5">{tr('Si salís, la grabación se corta. ¿Qué hacemos con ella?')}</p>
            <div className="mt-5 space-y-2.5">
              <button onClick={saveAndExit} disabled={saving} className="w-full h-12 rounded-full bg-[#F4F5F8] text-[#121212] font-bold disabled:opacity-60">{saving ? tr('Guardando…') : tr('Guardar y salir')}</button>
              <button onClick={keepPlaying} disabled={saving} className="w-full h-12 rounded-full bg-white/10 text-white font-semibold disabled:opacity-60">{tr('Seguir tocando')}</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'premium' && <PremiumRecording onClose={() => setDialog(null)} />}
    </>
  );
});

export default LiveRecorder;
