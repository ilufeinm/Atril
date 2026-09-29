import React, { useState } from 'react';
import { Moon, Sun, MonitorSmartphone, Bluetooth, Laptop } from 'lucide-react';
import PedalSettings from './PedalSettings';
import { getThemeMode, applyTheme } from '@/lib/theme';

const MODES = [
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'system', label: 'Sistema', Icon: Laptop },
];

export default function PreferencesSection() {
  const [mode, setMode] = useState(getThemeMode());
  const [wake, setWake] = useState(localStorage.getItem('stage-wake') !== 'off');
  const selectMode = (m) => { setMode(m); applyTheme(m); };
  const toggleWake = () => { const n = !wake; setWake(n); localStorage.setItem('stage-wake', n ? 'on' : 'off'); };
  const Toggle = ({ on }) => <span className={`w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-[#c9ef72]' : 'bg-white/15'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} /></span>;
  return (
    <div className="bg-[#242831] rounded-2xl divide-y divide-white/10">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3 text-sm"><Moon size={18} /> Tema de la app</div>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => selectMode(value)} className={`flex flex-col items-center gap-1.5 h-16 rounded-xl text-xs font-semibold transition-colors select-none ${mode === value ? 'bg-[#c9ef72]/15 text-[#c9ef72] border border-[#c9ef72]/40' : 'bg-white/5 text-white/60 border border-transparent'}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
        {mode === 'system' && <p className="text-xs text-white/40 mt-2">ScoreBook seguirá automáticamente el tema claro/oscuro de tu dispositivo.</p>}
      </div>
      <button onClick={toggleWake} className="w-full flex justify-between items-center p-5 text-sm select-none"><span className="flex items-center gap-3"><MonitorSmartphone size={18} /> Mantener pantalla encendida</span><Toggle on={wake} /></button>
      <div className="p-5"><div className="flex items-center gap-3 mb-3 text-sm"><Bluetooth size={18} /> Pedal Bluetooth (paso de pág.)</div><PedalSettings /></div>
    </div>
  );
}