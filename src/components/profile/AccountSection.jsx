import React, { useState } from 'react';
import { LogOut, Crown, Mail, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { planLabel, isPremium } from '@/lib/subscription';

export default function AccountSection({ user }) {
  const [busy, setBusy] = useState(false);
  const logout = () => base44.auth.logout(window.location.origin);

  const upgrade = async () => {
    if (window.self !== window.top) {
      alert('El pago solo se puede completar desde la app publicada, no desde el editor.');
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        email: user?.email,
        user_id: user?.id,
        origin: window.location.origin
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert(res.data?.error || 'No se pudo iniciar el pago.');
      }
    } catch (e) {
      alert('No se pudo iniciar el pago.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#242831] rounded-2xl divide-y divide-white/10">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Cuenta</div>
          <div className="font-semibold truncate">{user?.full_name || 'Músico de StageBook'}</div>
          <div className="text-sm text-white/45 flex items-center gap-2 mt-1"><Mail size={14} /> {user?.email || '—'}</div>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 ${isPremium(user) ? 'bg-[#c9ef72]/20 text-[#c9ef72]' : 'bg-white/10 text-white/60'}`}><Crown size={13} /> {planLabel(user)}</span>
      </div>
      {!isPremium(user) && (
        <div className="p-5">
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
      )}
      <button onClick={logout} className="w-full flex items-center gap-3 p-5 text-sm text-red-300"><LogOut size={18} /> Cerrar sesión</button>
    </div>
  );
}