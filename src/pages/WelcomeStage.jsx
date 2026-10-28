import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useStage } from '@/components/stage/StageProvider';
import OnboardingAuth from '@/components/stage/OnboardingAuth';
import OnboardingTop, { ONBOARDING_SHEET } from '@/components/stage/OnboardingTop';
import { tr } from '@/i18n';
// Bienvenida: 1 · qué es Atril → 2 · probá pasar de página → 3 · cuenta. Después, directo al Inicio.

const NAVY_LIGHT = 'radial-gradient(70% 55% at 50% 30%, rgba(38,64,140,.55) 0%, rgba(16,34,74,.25) 45%, rgba(18,18,18,0) 75%)';
const SCREEN = 'relative isolate min-h-[100svh] bg-[#121212] text-[#F4F5F8] flex flex-col max-w-xl mx-auto overflow-hidden';
const CTA = 'w-full h-[54px] rounded-full home-cta font-bold text-base flex items-center justify-center gap-2 active:scale-[.98] transition-transform';

// Paso 2: la hoja se toca como en el Modo En Vivo (derecha avanza, izquierda vuelve).
// Hay una sola página de ejemplo, así que se muestra el gesto: la hoja se desliza y destella el borde.
function TapDemo({ onTap }) {
  const reduce = useReducedMotion();
  const page = useAnimation();
  const [taps, setTaps] = useState(0);
  const [flash, setFlash] = useState(null);
  const tap = (dir) => {
    setTaps((n) => n + 1);
    setFlash({ dir, n: Date.now() });
    onTap(dir);
    if (!reduce) {
      const d = dir === 'next' ? 36 : -36;
      page.start({ x: [0, -d, d, 0], opacity: [1, 0, 0, 1] }, { duration: 0.42, times: [0, 0.45, 0.46, 1], ease: [0.2, 0.8, 0.2, 1] });
    }
  };
  return (
    <div className="relative h-full max-w-full aspect-[5/7] mx-auto rounded-[18px] bg-black p-2 ring-1 ring-white/10 shadow-[0_28px_60px_rgba(0,0,0,.5)] overflow-hidden">
      <motion.img animate={page} src={ONBOARDING_SHEET} alt={tr('Partitura de ejemplo a pantalla completa, como en el Modo En Vivo')} className="w-full h-full object-contain rounded-[2px] bg-white select-none" draggable={false} />
      {flash && (
        <motion.div key={flash.n} aria-hidden="true" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
          className={`absolute top-0 bottom-0 w-2.5 z-[2] ${flash.dir === 'next' ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-white/75 to-transparent`} />
      )}
      {taps === 0 && (
        <div aria-hidden="true" className="absolute inset-0 z-[2] flex text-[13px] font-bold text-white pointer-events-none">
          <div className="w-1/3 bg-black/55 border-r border-dashed border-white/45 flex items-center justify-center">‹ {tr('Anterior')}</div>
          <div className="flex-1 bg-black/35 flex items-center justify-center">{tr('Siguiente')} ›</div>
        </div>
      )}
      <button onClick={() => tap('prev')} className="absolute inset-y-0 left-0 w-1/3 z-[3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47B6A] focus-visible:-outline-offset-4" aria-label={tr('Página anterior')} />
      <button onClick={() => tap('next')} className="absolute inset-y-0 right-0 w-2/3 z-[3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47B6A] focus-visible:-outline-offset-4" aria-label={tr('Página siguiente')} />
    </div>
  );
}

export default function WelcomeStage() {
  const { user, loading, completeOnboarding } = useStage();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  // Al volver de iniciar sesión (correo o Google) se llega con ?step=listo: se cierra la bienvenida y se va al Inicio.
  const listo = useRef(new URLSearchParams(window.location.search).get('step') === 'listo').current;
  const [step, S] = useState(0);
  const [authMode, setAuthMode] = useState('register');
  const [lastTap, setLastTap] = useState(null);

  const finish = async () => { await completeOnboarding(); nav('/', { replace: true }); };
  useEffect(() => {
    if (listo && user) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, user]);
  if (listo && (user || loading)) return <div className="fixed inset-0 bg-[#121212]" />;

  // PASO 3 — Crear cuenta / Iniciar sesión
  if (step === 2) {
    return <OnboardingAuth initialMode={authMode} onBack={() => S(authMode === 'login' ? 0 : 1)} />;
  }

  // PASO 2 — Probá el Modo En Vivo
  if (step === 1) {
    const hint = lastTap === 'next'
      ? tr('Página siguiente. En el show es igual: un toque y seguís tocando.')
      : lastTap === 'prev'
        ? tr('Página anterior. Para volver a un estribillo sin buscar.')
        : tr('A la derecha, la página siguiente. A la izquierda, la anterior. Nada tapa la música.');
    return (
      <div className={SCREEN}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[420px] -z-10" style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(30,52,110,.4) 0%, rgba(18,18,18,0) 70%)' }} />
        <div className="px-6 pt-[calc(env(safe-area-inset-top)+20px)]"><OnboardingTop step={1} onBack={() => S(0)} /></div>
        <h1 className="px-6 mt-6 font-display text-[30px] leading-[1.08] font-extrabold tracking-tight">{tr('Tocá la hoja para pasar de página')}</h1>
        <div className="flex-1 min-h-[300px] px-6 mt-6"><TapDemo onTap={setLastTap} /></div>
        <p aria-live="polite" className="px-6 mt-4 min-h-[48px] text-[15px] leading-relaxed text-white/80">{hint}</p>
        <div className="px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
          <button onClick={() => (user ? finish() : (setAuthMode('register'), S(2)))} className={CTA}>{tr('Continuar')}{' '}<ArrowRight size={18} /></button>
        </div>
      </div>
    );
  }

  // PASO 1 — Bienvenida
  return (
    <div className={SCREEN}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[70svh] -z-10" style={{ background: NAVY_LIGHT }} />
      <div className="px-6 pt-[calc(env(safe-area-inset-top)+20px)]"><OnboardingTop step={0} /></div>
      <div aria-hidden="true" className="relative flex-1 min-h-[260px] flex justify-center pt-10 overflow-hidden">
        <motion.img
          src={ONBOARDING_SHEET} alt=""
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.3 : 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-[78%] max-w-[320px] self-start rounded-[3px] shadow-[0_30px_60px_rgba(0,0,0,.55)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-[#121212]/0 via-[#121212]/90 via-45% to-[#121212] to-75%" />
      </div>
      <div className="relative -mt-20 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <h1 className="font-display text-[38px] leading-[1.05] font-extrabold tracking-tight">{tr('Tu atril,')}<br />{tr('siempre listo.')}</h1>
        <p className="mt-3.5 text-base leading-relaxed text-white/80">{tr('Tus partituras en el celular, listas para el ensayo y el show. Con tu banda, sin carpetas.')}</p>
        <button onClick={() => S(1)} className={`${CTA} mt-7`}>{tr('Empezar')}{' '}<ArrowRight size={18} /></button>
        {!user && (
          <button onClick={() => { setAuthMode('login'); S(2); }} className="w-full h-11 mt-1.5 text-[15px] font-semibold text-white/85">{tr('Ya tengo cuenta')}</button>
        )}
      </div>
    </div>
  );
}
