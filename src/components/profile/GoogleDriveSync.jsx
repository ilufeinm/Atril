import React, { useState, useEffect } from 'react';
import { Cloud, Check, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isPremium } from '@/lib/subscription';

export default function GoogleDriveSync({ user }) {
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const premium = isPremium(user);

  useEffect(() => {
    if (!premium) { setStatus('off'); return; }
    base44.functions.invoke('googleDriveStatus', {})
      .then((r) => { setStatus(r?.connected ? 'connected' : 'off'); setEmail(r?.email || ''); })
      .catch(() => setStatus('off'));
  }, [premium]);

  if (!premium) return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-white/55"><Lock size={15} /> Google Drive es una función Premium.</div>
      <p className="text-xs text-white/35">Mejorá a Premium para sincronizar tus partituras en la nube de Google Drive.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="text-sm flex items-center gap-2">
        {status === 'connected'
          ? <><Check size={16} className="text-[#c9ef72]" /> <span className="text-white">Cuenta de Google conectada{email ? ` · ${email}` : ''}</span></>
          : <><Cloud size={16} className="text-white/45" /> <span className="text-white/55">{status === 'checking' ? 'Verificando conexión…' : 'Sin conectar'}</span></>}
      </div>
      <p className="text-xs text-white/35">La conexión se autoriza desde la configuración del workspace de StageBook. Una vez vinculada, aquí se mostrará “Conectado”.</p>
    </div>
  );
}