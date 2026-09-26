import React, { useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { useStage } from './StageProvider';

export default function DemoBanner() {
  const { demoDismissed, dismissDemo, demoSongs, demoSets } = useStage();
  const [confirm, setConfirm] = useState(false);
  if (demoDismissed || (!demoSongs?.length && !demoSets?.length)) return null;
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[.04] border border-white/10 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center shrink-0"><Sparkles size={18} /></span>
          <div className="min-w-0">
            <div className="font-semibold text-sm flex items-center gap-2">Contenido de demostración <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span></div>
            <p className="text-xs text-white/45 mt-0.5">Explora estos ejemplos para entender cómo funciona StageBook.</p>
          </div>
        </div>
        <button onClick={() => setConfirm(true)} className="shrink-0 h-10 px-4 rounded-xl bg-white/10 text-red-200 text-sm font-semibold flex items-center gap-2"><Trash2 size={16} /> <span className="hidden sm:inline">Eliminar ejemplos</span></button>
      </div>
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(false)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><Trash2 size={26} /></div>
            <h2 className="text-xl font-bold">¿Eliminar contenido de demostración?</h2>
            <p className="text-sm text-white/50 mt-2">Podrás comenzar a agregar tus propias partituras y repertorios.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirm(false)} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Cancelar</button>
              <button onClick={() => { dismissDemo(); setConfirm(false); }} className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold">Eliminar ejemplos</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}