import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { tr, getManualLanguage, setLanguagePreference } from '@/i18n';

// Idioma de la app. Por defecto sigue al dispositivo; elegir uno lo deja fijo en este dispositivo.
// Los nombres de idioma van en su propio idioma ("Español", "English") para que siempre se reconozcan.
const OPTIONS = [
  { value: 'auto', label: () => tr('Automático') },
  { value: 'es', label: () => 'Español' },
  { value: 'en', label: () => 'English' },
];

export default function LanguageSection() {
  const [mode, setMode] = useState(() => getManualLanguage() || 'auto');
  const select = async (value) => {
    if (value === mode) return;
    setMode(value);
    await setLanguagePreference(value);
    // Recargar para que todos los textos (también los que se arman al abrir la app) salgan en el idioma nuevo.
    window.location.reload();
  };

  return (
    <div className="glass-flat rounded-3xl p-5">
      <div className="flex items-center gap-3 mb-3 text-sm"><Languages size={18} /> {tr('Idioma')}</div>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={tr('Idioma')}>
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            role="radio"
            aria-checked={mode === value}
            onClick={() => select(value)}
            className={`h-12 rounded-2xl text-xs font-semibold transition-colors select-none ${mode === value ? 'home-cta seg-on' : 'bg-white/[.07] text-white/70'}`}
          >
            {label()}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/60 mt-2">{tr('Por defecto, Atril usa el idioma de tu dispositivo. Si elegís uno, queda fijo en este dispositivo.')}</p>
    </div>
  );
}
