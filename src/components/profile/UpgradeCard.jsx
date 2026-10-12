import React, { useState, lazy, Suspense } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isPremium } from '@/lib/subscription';

const Paywall = lazy(() => import('@/components/premium/Paywall'));

export default function UpgradeCard() {
  const { user } = useAuth();
  // ?premium=1 abre la paywall directo (p. ej. desde el aviso de grabación premium).
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('premium') === '1');

  if (isPremium(user)) return null;

  return (
    <div className="bg-[#242831] rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-[#c9ef72]/15 flex items-center justify-center text-[#c9ef72] shrink-0"><Sparkles size={20} /></span>
        <div>
          <div className="font-semibold text-sm">Pasar a Premium</div>
          {/* Solo lo que Premium incluye de verdad hoy: la grabación de la performance. */}
          <p className="text-xs text-white/45 mt-1 leading-relaxed">Grabá tus shows y ensayos con la partitura sincronizada. US$4,99/mes.</p>
        </div>
      </div>
      <button onClick={() => setOpen(true)} className="w-full h-11 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center justify-center gap-2">
        <Crown size={17} /> Mejorar a Premium
      </button>
      {open && <Suspense fallback={null}><Paywall onClose={() => setOpen(false)} /></Suspense>}
    </div>
  );
}
