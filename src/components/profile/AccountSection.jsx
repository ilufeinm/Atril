import React, { useState } from 'react';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { clearOnboarding } from '@/lib/onboarding';
import { tr } from '@/i18n';

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
      alert(tr('No se pudo eliminar la cuenta. Intenta de nuevo.'));
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <div className="glass-flat rounded-2xl divide-y divide-white/10">
      {/* El nombre y el mail ya están en la tarjeta de arriba del Perfil: acá solo las acciones. */}
      <button onClick={logout} className="w-full flex items-center gap-3 p-5 text-sm text-red-300"><LogOut size={18} /> {tr('Cerrar sesión')}</button>
      <button onClick={() => setConfirmDel(true)} className="w-full flex items-center gap-3 p-5 text-sm text-red-300/70"><Trash2 size={18} /> {tr('Eliminar cuenta')}</button>
      {confirmDel && (
        <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setConfirmDel(false)}>
          <div className="glass-sheet border rounded-2xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={26} /></div>
            <h2 className="text-xl font-bold">{tr('¿Eliminar tu cuenta?')}</h2>
            <p className="text-sm text-white/70 mt-2">{tr('Se borrarán permanentemente todas tus partituras, repertorios, bandas y grabaciones. Esta acción no se puede deshacer.')}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDel(false)} disabled={deleting} className="flex-1 h-12 rounded-full bg-white/[.12] text-white font-semibold">{tr('Cancelar')}</button>
              <button onClick={deleteAccount} disabled={deleting} className="flex-1 h-12 rounded-full bg-red-500 text-white font-bold">{deleting ? tr('Eliminando…') : tr('Eliminar todo')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}