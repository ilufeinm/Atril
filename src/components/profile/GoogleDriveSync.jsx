import React, { useState, useEffect } from 'react';
import { Cloud, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GoogleDriveSync() {
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState('');

  useEffect(() => {
    base44.functions.invoke('googleDriveStatus', {})
      .then((r) => { const d = r?.data || r; setStatus(d?.connected ? 'connected' : 'off'); setEmail(d?.email || ''); })
      .catch(() => setStatus('off'));
  }, []);

  return (
    <div className="space-y-2">
      <div className="text-sm flex items-center gap-2">
        {status === 'connected'
          ? <><Check size={16} className="text-[#c9ef72]" /> <span className="text-white">Cuenta de Google conectada{email ? ` · ${email}` : ''}</span></>
          : <><Cloud size={16} className="text-white/45" /> <span className="text-white/55">{status === 'checking' ? 'Verificando conexión…' : 'Sin conectar'}</span></>}
      </div>
      <p className="text-xs text-white/35">La conexión se autoriza desde la configuración del workspace de Atril. Una vez vinculada, aquí se mostrará “Conectado”.</p>
    </div>
  );
}