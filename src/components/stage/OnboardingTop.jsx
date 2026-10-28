import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { AtrilMark } from '@/components/glass';
import { tr } from '@/i18n';

// Partitura de ejemplo de la bienvenida (Charleston, 1923, dominio público).
export const ONBOARDING_SHEET = '/onboarding/partitura.png';

// Barra de arriba de la bienvenida: marca (o volver) y progreso de 3 pasos.
export default function OnboardingTop({ step, onBack }) {
  return (
    <div className="flex items-center gap-3.5 h-9">
      {onBack
        ? <button onClick={onBack} className="-ml-2 w-9 h-9 rounded-full flex items-center justify-center text-white" aria-label={tr('Paso anterior')}><ChevronLeft size={22} /></button>
        : <span className="w-[26px] h-[26px] rounded-[7px] bg-[#10224A] text-white flex items-center justify-center"><AtrilMark size={15} /></span>}
      <div className="flex-1 flex gap-1.5" role="img" aria-label={tr('Paso {{n}} de 3', { n: step + 1 })}>
        {[0, 1, 2].map((i) => <div key={i} className={`h-[3px] flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/20'}`} />)}
      </div>
    </div>
  );
}
