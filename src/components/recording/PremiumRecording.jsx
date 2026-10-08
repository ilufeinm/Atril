import React from 'react';
import { Link } from 'react-router-dom';
import { X, Mic, Sparkles, Music2, Star } from 'lucide-react';

export default function PremiumRecording({ onClose }) {
  return (
    <div className="anim-backdrop fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c9ef72] bg-[#c9ef72]/15 px-2.5 py-1 rounded-full"><Sparkles size={12} /> Premium</span>
          <button onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center mb-4"><Mic size={26} /></div>
        <h2 className="text-2xl font-bold">Grabación de Performance</h2>
        <p className="text-sm text-white/55 mt-2">Grabá tus ensayos y shows con audio y partitura sincronizada, marcadores automáticos por canción y notas de performance.</p>
        <ul className="mt-5 space-y-2.5 text-sm text-white/70">
          <li className="flex items-center gap-2"><Mic size={16} className="text-[#c9ef72]" /> Audio + partitura sincronizada</li>
          <li className="flex items-center gap-2"><Music2 size={16} className="text-[#c9ef72]" /> Marcadores automáticos por canción</li>
          <li className="flex items-center gap-2"><Star size={16} className="text-[#c9ef72]" /> Notas de performance con timestamp</li>
        </ul>
        <Link to="/perfil" onClick={onClose} className="mt-6 w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center justify-center">Mejorar a Premium</Link>
        <button onClick={onClose} className="mt-2 w-full h-11 text-white/50 text-sm">Ahora no</button>
      </div>
    </div>
  );
}