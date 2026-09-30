import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const Toggle = ({ on }) => (
  <span className={`w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-[#c9ef72]' : 'bg-white/15'}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
  </span>
);

export default function NotificationToggle() {
  const [on, setOn] = useState(localStorage.getItem('stage-notify') === 'on');

  const toggle = async () => {
    const n = !on;
    if (n && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    setOn(n);
    localStorage.setItem('stage-notify', n ? 'on' : 'off');
  };

  return (
    <button onClick={toggle} className="w-full flex justify-between items-center p-5 text-sm select-none">
      <span className="flex items-center gap-3"><Bell size={18} /> Avisos de actividad de la banda</span>
      <Toggle on={on} />
    </button>
  );
}