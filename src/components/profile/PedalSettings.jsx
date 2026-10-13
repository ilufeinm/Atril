import React, { useState } from 'react';
import { Bluetooth, Check, Loader2, Info } from 'lucide-react';
import { useBluetoothPedal } from '@/hooks/useBluetoothPedal';

export default function PedalSettings() {
  const { connected, name, connect, disconnect, supported } = useBluetoothPedal();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doConnect = async () => { setErr(''); setBusy(true); try { await connect(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  if (!supported) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            <Bluetooth size={16} className="text-white/45" />
            <span className="text-white/70">Sin pedal conectado</span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-2xl bg-white/[.07] p-3 text-xs text-white/70">
          <Info size={14} className="mt-0.5 shrink-0 text-white/45" />
          <p>El Bluetooth directo no está disponible en este dispositivo. Si tu pedal funciona como teclado (flechas o AvPag), emparejalo desde los ajustes Bluetooth del teléfono y cambiará de página solo en el Modo En Vivo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm flex items-center gap-2">
          {connected ? <><Check size={16} className="text-[#c9ef72]" /> <span className="text-white">{name || 'Pedal conectado'}</span></> : <><Bluetooth size={16} className="text-white/45" /> <span className="text-white/70">Sin pedal conectado</span></>}
        </div>
        {connected ? (
          <button onClick={disconnect} className="h-9 px-4 rounded-full bg-white/[.12] text-sm font-semibold">Desconectar</button>
        ) : (
          <button onClick={doConnect} disabled={busy} className="home-cta h-9 px-4 rounded-full font-bold text-sm flex items-center gap-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <Bluetooth size={15} />} Conectar</button>
        )}
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
      <p className="text-xs text-white/60">Los pedales que funcionan como teclado (flechas o AvPag) se emparejan desde los ajustes Bluetooth del teléfono y cambian de página automáticamente en el Modo En Vivo. Para pedales BLE, conectá el dispositivo aquí.</p>
    </div>
  );
}