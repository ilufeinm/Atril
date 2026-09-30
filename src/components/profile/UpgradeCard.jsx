import React, { useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isPremium } from '@/lib/subscription';

export default function UpgradeCard() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const upgrade = async () => {
    setBusy(true);
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setBusy(false);
      alert('Permití las ventanas emergentes para continuar con el pago.');
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;
    try {
      const res = await base44.functions.invoke('createCheckout', { origin: window.location.origin });
      if (res.data?.url) {
        if (checkoutTab) checkoutTab.location.replace(res.data.url);
        else window.location.assign(res.data.url);
      } else {
        checkoutTab?.close();
        alert(res.data?.error || 'No se pudo iniciar el pago.');
      }
    } catch (e) {
      checkoutTab?.close();
      alert(e.response?.data?.error || 'No se pudo iniciar el pago.');
    } finally {
      setBusy(false);
    }
  };

  if (isPremium(user)) return null;

  return (
    <div className="bg-[#242831] rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-[#c9ef72]/15 flex items-center justify-center text-[#c9ef72] shrink-0"><Sparkles size={20} /></span>
        <div>
          <div className="font-semibold text-sm">Pasar a Premium</div>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">Repertorios y modo banda ilimitados, sincronización con Google Drive y soporte prioritario. US$4,99/mes.</p>
        </div>
      </div>
      <button onClick={upgrade} disabled={busy} className="w-full h-11 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? 'Redirigiendo a Stripe…' : <><Crown size={17} /> Mejorar a Premium</>}
      </button>
    </div>
  );
}