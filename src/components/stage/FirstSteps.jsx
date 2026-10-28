import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useStage } from './StageProvider';
import { tr } from '@/i18n';

// "Primeros pasos" del Inicio: reemplaza el paso de importar que tenía la bienvenida.
// Cada paso se tilda solo cuando el músico lo hizo de verdad. Se oculta a mano o al completar los tres.
const KEY = 'atril-primeros-pasos-oculto';
const isHidden = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function FirstSteps({ onImport }) {
  const { hasOwnContent, sets, allBands, bandsLoaded, setsLoaded, loading, loadFailed } = useStage();
  const nav = useNavigate();
  const [hidden, setHidden] = useState(isHidden);

  const steps = [
    { key: 'importar', title: tr('Importá tu primera partitura'), sub: tr('PDF o fotos, desde el celular'), done: hasOwnContent, go: onImport },
    { key: 'repertorio', title: tr('Armá el repertorio de tu próximo show'), sub: tr('Elegí los temas y el orden'), done: (sets || []).length > 0, go: () => nav('/repertorios') },
    { key: 'banda', title: tr('Invitá a tu banda'), sub: tr('Mandales el enlace y tocan el mismo set'), done: (allBands || []).some((b) => !b.is_demo), go: () => nav('/modo-banda') },
  ];
  const done = steps.filter((s) => s.done).length;
  // Sin datos completos no se muestra: evita tildes que aparecen y desaparecen.
  if (hidden || loading || loadFailed || !setsLoaded || !bandsLoaded || done === steps.length) return null;

  const hide = () => { try { localStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento: solo esta vez */ } setHidden(true); };

  return (
    <section aria-label={tr('Primeros pasos')} className="glass rounded-2xl px-3.5 pt-3.5 pb-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display font-extrabold text-[17px]">{tr('Primeros pasos')}</h2>
          <span className="text-[13px] text-white/65 tabular-nums">{tr('{{n}} de 3', { n: done })}</span>
        </div>
        <button onClick={hide} className="px-1.5 py-2 text-[13px] font-semibold text-white/70">{tr('Ocultar')}</button>
      </div>
      <div className="h-1 rounded-full bg-white/10 mt-2 mb-1 overflow-hidden" aria-hidden="true">
        <div className="h-1 rounded-full bg-[#C9EF72] transition-[width] duration-500" style={{ width: `${Math.round((done / 3) * 100)}%` }} />
      </div>
      <ul>
        {steps.map((s) => (
          <li key={s.key}>
            <button onClick={s.go} className="w-full flex items-center gap-3 py-3 px-1 text-left">
              {s.done
                ? <span className="w-[26px] h-[26px] rounded-full bg-[#C9EF72] text-[#111113] flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3.2} aria-label={tr('Hecho')} /></span>
                : <span className="w-[26px] h-[26px] rounded-full border-2 border-white/30 shrink-0" aria-hidden="true" />}
              <span className="flex-1 min-w-0">
                <span className={`block text-[15px] font-semibold ${s.done ? 'text-white/60' : ''}`}>{s.title}</span>
                <span className="block text-[13px] text-white/65 mt-0.5">{s.sub}</span>
              </span>
              <ChevronRight size={16} className="text-white/50 shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
