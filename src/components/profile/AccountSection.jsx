import React, { useState } from 'react';
import { LogOut, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { clearOnboarding } from '@/lib/onboarding';

export default function AccountSection({ user }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const logout = () => { clearOnboarding(); base44.auth.logout(window.location.origin); };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteAccount', {});
      clearOnboarding();
      base44.auth.logout(window.location.origin);
    } catch (e) {
      alert('No se pudo eliminar la cuenta. Intenta de nuevo.');
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <div className="bg-[#242831] rounded-2xl divide-y divide-white/10">
      <div className="p-5">
        <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Cuenta</div>
        <div className="font-semibold truncate">{user?.full_name || 'Músico de Atril'}</div>
        <div className="text-sm text-white/45 flex items-center gap-2 mt-1"><Mail size={14} /> {user?.email || '—'}</div>
      </div>
      <button onClick={logout} className="w-full flex items-center gap-3 p-5 text-sm text-red-300"><LogOut size={18} /> Cerrar sesión</button>
      <button onClick={() => setConfirmDel(true)} className="w-full flex items-center gap-3 p-5 text-sm text-red-300/70"><Trash2 size={18} /> Eliminar cuenta</button>
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setConfirmDel(false)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={26} /></div>
            <h2 className="text-xl font-bold">¿Eliminar tu cuenta?</h2>
            <p className="text-sm text-white/50 mt-2">Se borrarán permanentemente todas tus partituras, repertorios, bandas y grabaciones. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDel(false)} disabled={deleting} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Cancelar</button>
              <button onClick={deleteAccount} disabled={deleting} className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold">{deleting ? 'Eliminando…' : 'Eliminar todo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}