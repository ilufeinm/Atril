import React from 'react';
import { LogOut, Crown, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { planLabel, isPremium } from '@/lib/subscription';

export default function AccountSection({ user }) {
  const logout = () => base44.auth.logout(window.location.origin);
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
      <button onClick={logout} className="w-full flex items-center gap-3 p-5 text-sm text-red-300"><LogOut size={18} /> Cerrar sesión</button>
    </div>
  );
}