import React, { useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import NotificationToggle from './NotificationToggle';
import { getThemeMode, applyTheme } from '@/lib/theme';

const MODES = [
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'system', label: 'Sistema', Icon: Laptop },
];

export default function PreferencesSection() {
  const [mode, setMode] = useState(getThemeMode());
  const selectMode = (m) => { setMode(m); applyTheme(m); };

  return (
    <div className="glass-flat rounded-3xl divide-y divide-white/10">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3 text-sm"><Moon size={18} /> Tema de la app</div>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => selectMode(value)} className={`flex flex-col items-center gap-1.5 h-16 justify-center rounded-2xl text-xs font-semibold transition-colors select-none ${mode === value ? 'home-cta seg-on' : 'bg-white/[.07] text-white/70'}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
        {mode === 'system' && <p className="text-xs text-white/60 mt-2">Atril seguirá automáticamente el tema claro/oscuro de tu dispositivo.</p>}
      </div>
      <NotificationToggle />
    </div>
  );
}