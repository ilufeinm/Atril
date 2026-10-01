import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music2, ArrowRight, ArrowLeft, Upload, CheckCheck, Camera, FileUp, Cloud, Play } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';
import OnboardingAuth from '@/components/stage/OnboardingAuth';
import LivePreviewMock from '@/components/stage/LivePreviewMock';
// Onboarding flow: 3 intro screens → mockup Modo En Vivo → auth → ¡Listo!

const INSTRUMENTS = ['Guitarra', 'Piano / teclado', 'Bajo', 'Batería', 'Voz', 'Vientos', 'Cuerdas', 'Otro'];
const IMPORT_OPTIONS = [[Camera, 'Escanear con cámara', 'Captura partituras físicas al instante'], [FileUp, 'Importar archivos', 'PDF, MusicXML, Imagen, TXT'], [Cloud, 'Google Drive', 'Sincroniza tus carpetas en la nube']];

export default function WelcomeStage() {
  const { user, completeOnboarding } = useStage();
  const nav = useNavigate();
  const [step, S] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('step') === 'listo' ? 5 : 0;
  });
  const [instrument, I] = useState(localStorage.getItem('stage-instrument') || '');
  const steps = [
    { tag: '01 / 04', title: 'Bienvenido a ScoreBook', text: 'Tu música, organizada para que lo único que importe sea tocar.', icon: Music2 },
    { tag: '02 / 04', title: '¿Qué instrumento tocas?', text: 'Hagamos de este espacio tuyo.', icon: Music2 },
    { tag: '03 / 04', title: 'Importa tus partituras', text: 'Trae tu música desde donde quieras para tenerla siempre lista en escena.', icon: Upload }
  ];
  const current = steps[step], Icon = current?.icon;
  const pickInstrument = (v) => { I(v); localStorage.setItem('stage-instrument', v); };

  // ÚLTIMA PANTALLA — ¡Listo!
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-center max-w-xl mx-auto">
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(142,154,175,.35), transparent 70%)' }} />
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ border: '2px solid #8e9aaf', background: 'rgba(142,154,175,.10)' }}><CheckCheck size={46} style={{ color: '#8e9aaf' }} /></div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">¡Listo!</h1>
        <p className="text-[#a0a0a0] mt-4 text-base sm:text-lg leading-relaxed">Todo está preparado. Empezá a explorar ScoreBook.</p>
        <div className="mt-8">
          <button onClick={async () => { await completeOnboarding(); nav('/'); }} className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold">Explorar la app <ArrowRight size={18} /></button>
        </div>
      </div>
    );
  }

  // PENÚLTIMA PANTALLA — Iniciar sesión / Crear cuenta
  if (step === 4) {
    return <OnboardingAuth onBack={() => S(3)} />;
  }

  // CUARTA PANTALLA — Mockup animado del Modo En Vivo
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-center items-center max-w-xl mx-auto">
        <div className="flex gap-2 mb-10 w-full max-w-xs">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-[#8e9aaf]' : 'bg-white/10'}`} />)}</div>
        <span className="text-[#8e9aaf] text-xs font-bold tracking-widest">04 / 04</span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-center mt-4">Tocá en vivo sin distracciones</h1>
        <p className="text-[#a0a0a0] mt-4 text-base sm:text-lg leading-relaxed text-center">El Modo En Vivo te da la partitura a pantalla completa, navegación con un toque y grabación sincronizada.</p>
        <div className="my-10"><LivePreviewMock /></div>
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => S(2)} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center" aria-label="Paso anterior"><ArrowLeft /></button>
          <button onClick={() => user ? S(5) : S(4)} className="h-12 px-6 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center gap-2">Continuar <ArrowRight size={18} /></button>
        </div>
      </div>
    );
  }

  // PASOS INTRODUCTORIOS 0–2
  const next = () => {
    if (step < 2) S(step + 1);
    else S(3); // va al mockup del Modo En Vivo
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-center max-w-xl mx-auto">
      <div className="flex gap-2 mb-10">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#8e9aaf]' : 'bg-white/10'}`} />)}</div>
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
        <button onClick={next} className="h-12 px-6 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center gap-2">Continuar <ArrowRight size={18} /></button>
        {step === 2 && <button onClick={next} className="text-sm text-[#a0a0a0] ml-2 underline">Saltar por ahora</button>}
      </div>
    </div>
  );
}