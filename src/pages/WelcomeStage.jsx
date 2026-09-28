import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music2, ArrowRight, ArrowLeft, Upload, ListMusic, Check, CheckCheck, Camera, FileUp, Cloud } from 'lucide-react';

const INSTRUMENTS = ['Guitarra', 'Piano / teclado', 'Bajo', 'Batería', 'Voz', 'Vientos', 'Cuerdas', 'Otro'];
const IMPORT_OPTIONS = [[Camera, 'Escanear con cámara', 'Captura partituras físicas al instante'], [FileUp, 'Importar archivos', 'PDF, MusicXML, Imagen, TXT'], [Cloud, 'Google Drive', 'Sincroniza tus carpetas en la nube']];
const READY_CHECKS = ['Instrumento seleccionado para transposición rápida', 'Modo escenario con fondo antirreflejo listo', 'Sincronización en tiempo real habilitada'];

export default function WelcomeStage() {
  const [step, S] = useState(0);
  const [instrument, I] = useState(localStorage.getItem('stage-instrument') || '');
  const [done, D] = useState(false);
  const steps = [
    { tag: '01 / 03', title: 'Bienvenido a StageBook', text: 'Tu música, organizada para que lo único que importe sea tocar.', icon: Music2 },
    { tag: '02 / 03', title: '¿Qué instrumento tocas?', text: 'Hagamos de este espacio tuyo.', icon: Music2 },
    { tag: '03 / 03', title: 'Importa tus partituras', text: 'Trae tu música desde donde quieras para tenerla siempre lista en escena.', icon: Upload }
  ];
  const current = steps[step], Icon = current.icon;
  const pickInstrument = (v) => { I(v); localStorage.setItem('stage-instrument', v); };

  if (done) {
    return (
      <div className="max-w-xl mx-auto min-h-[80vh] flex flex-col justify-center text-center py-10">
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(142,154,175,.35), transparent 70%)' }} />
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ border: '2px solid #8e9aaf', background: 'rgba(142,154,175,.10)' }}><CheckCheck size={46} style={{ color: '#8e9aaf' }} /></div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">¡Listo para el escenario!</h1>
        <p className="text-[#a0a0a0] mt-4 text-base sm:text-lg leading-relaxed">Tu biblioteca musical está configurada. Crea tu primer repertorio o navega para descubrir tus canciones.</p>
        <div className="text-left rounded-2xl bg-[#1e1e22] p-5 mt-8 space-y-3">
          {READY_CHECKS.map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm text-white/80">
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(142,154,175,.18)' }}><Check size={13} style={{ color: '#8e9aaf' }} /></span>{t}
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <Link to="/repertorios?nuevo=1" className="flex items-center justify-center gap-2 h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold"><ListMusic size={18} /> Crear mi primer repertorio</Link>
          <Link to="/" className="flex items-center justify-center h-12 rounded-full bg-[#1e1e22] border border-[#2b2b30] text-white font-semibold">Explorar la app</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-[80vh] flex flex-col justify-center py-10">
      <div className="flex gap-2 mb-10">{[0, 1, 2].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#8e9aaf]' : 'bg-white/10'}`} />)}</div>
      <span className="text-[#8e9aaf] text-xs font-bold tracking-widest">{current.tag}</span>
      <span className="w-20 h-20 bg-[#8e9aaf]/12 text-[#8e9aaf] rounded-3xl flex items-center justify-center mt-6 mb-8"><Icon size={38} /></span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{current.title}</h1>
      <p className="text-[#a0a0a0] mt-4 text-base sm:text-lg leading-relaxed">{current.text}</p>

      {step === 1 && (
        <div className="flex flex-wrap gap-2 mt-7">{INSTRUMENTS.map((item) => <button key={item} onClick={() => pickInstrument(item)} className={`px-4 h-11 rounded-xl text-sm ${instrument === item ? 'bg-[#8e9aaf] text-[#121212] font-bold' : 'bg-[#1e1e22] text-white/70 border border-[#2b2b30]'}`}>{item}</button>)}</div>
      )}

      {step === 2 && (
        <div className="space-y-3 mt-7">{IMPORT_OPTIONS.map(([Ic, t, sub]) => (
          <Link to="/biblioteca?importar=1" key={t} className="flex items-center gap-4 bg-[#1e1e22] rounded-2xl p-4 hover:bg-[#262629] transition-colors border border-[#2b2b30]">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#8e9aaf]/12 text-[#8e9aaf]"><Ic size={22} /></span>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{t}</div><div className="text-xs text-[#a0a0a0] mt-1">{sub}</div></div>
            <ArrowRight size={18} className="text-white/40" />
          </Link>
        ))}</div>
      )}

      <div className="flex items-center gap-3 mt-10">
        {step > 0 && <button onClick={() => S(step - 1)} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Paso anterior"><ArrowLeft /></button>}
        {step < 2 ? (
          <button onClick={() => S(step + 1)} className="h-12 px-6 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center gap-2">Continuar <ArrowRight size={18} /></button>
        ) : (
          <button onClick={() => D(true)} className="h-12 px-6 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center gap-2">Continuar <ArrowRight size={18} /></button>
        )}
        {step === 2 && <Link to="/" className="text-sm text-[#a0a0a0] ml-2 underline">Saltar por ahora</Link>}
      </div>
    </div>
  );
}