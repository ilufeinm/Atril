import React, { useState } from 'react';
import { Bluetooth, Check, Loader2 } from 'lucide-react';
import { useBluetoothPedal } from '@/hooks/useBluetoothPedal';

export default function PedalSettings() {
  const { connected, name, connect, disconnect } = useBluetoothPedal();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doConnect = async () => { setErr(''); setBusy(true); try { await connect(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm flex items-center gap-2">
          {connected ? <><Check size={16} className="text-[#c9ef72]" /> <span className="text-white">{name || 'Pedal conectado'}</span></> : <><Bluetooth size={16} className="text-white/45" /> <span className="text-white/55">Sin pedal conectado</span></>}
        </div>
        {connected ? (
          <button onClick={disconnect} className="h-9 px-4 rounded-xl bg-white/10 text-sm">Desconectar</button>
        ) : (
          <button onClick={doConnect} disabled={busy} className="h-9 px-4 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center gap-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <Bluetooth size={15} />} Conectar</button>
        )}
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
      <p className="text-xs text-white/35">Los pedales que funcionan como teclado (flechas) ya cambian de página automáticamente. Para pedales BLE, conectá el dispositivo aquí.</p>
    </div>
  );
}