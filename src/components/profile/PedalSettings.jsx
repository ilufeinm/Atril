import React, { useState } from 'react';
import { Bluetooth, Check, Loader2, Info } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useBluetoothPedal } from '@/hooks/useBluetoothPedal';
import { tr } from '@/i18n';

// Plugin propio (android/.../SystemSettingsPlugin.java): abre la pantalla de Bluetooth del teléfono.
const SystemSettings = registerPlugin('SystemSettings');
const isAndroidApp = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export default function PedalSettings() {
  const { connected, name, connect, disconnect, supported } = useBluetoothPedal();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doConnect = async () => { setErr(''); setBusy(true); try { await connect(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  // App de Android: el pedal se empareja desde el Bluetooth del teléfono; el botón abre esa pantalla.
  if (isAndroidApp) {
    const openBt = async () => { setErr(''); try { await SystemSettings.openBluetooth(); } catch { setErr(tr('No se pudo abrir el Bluetooth. Abrilo desde los ajustes del teléfono.')); } };
    return (
      <div className="space-y-3">
        <button onClick={openBt} className="home-cta w-full h-12 rounded-full font-bold text-[15px] flex items-center justify-center gap-2"><Bluetooth size={17} /> {tr('Conectar pedal')}</button>
        {err && <p className="text-xs text-red-300">{err}</p>}
        <ol className="text-xs text-white/70 space-y-1.5 list-decimal pl-4">
          <li>{tr('Prendé el pedal y ponelo en modo emparejar (suele titilar una luz).')}</li>
          <li>{tr('Tocá')}{' '}<b className="text-white">{tr('Conectar pedal')}</b> {tr('y elegilo en la lista de Bluetooth.')}</li>
          <li>{tr('Volvé a Atril: en el Modo En Vivo, el pedal pasa de página solo.')}</li>
        </ol>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            <Bluetooth size={16} className="text-white/45" />
            <span className="text-white/70">{tr('Sin pedal conectado')}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-2xl bg-white/[.07] p-3 text-xs text-white/70">
          <Info size={14} className="mt-0.5 shrink-0 text-white/45" />
          <p>{tr('El Bluetooth directo no está disponible en este dispositivo. Si tu pedal funciona como teclado (flechas o AvPag), emparejalo desde los ajustes Bluetooth del teléfono y cambiará de página solo en el Modo En Vivo.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm flex items-center gap-2">
          {connected ? <><Check size={16} className="text-[#c9ef72]" /> <span className="text-white">{name || tr('Pedal conectado')}</span></> : <><Bluetooth size={16} className="text-white/45" /> <span className="text-white/70">{tr('Sin pedal conectado')}</span></>}
        </div>
        {connected ? (
          <button onClick={disconnect} className="h-9 px-4 rounded-full bg-white/[.12] text-sm font-semibold">{tr('Desconectar')}</button>
        ) : (
          <button onClick={doConnect} disabled={busy} className="home-cta h-9 px-4 rounded-full font-bold text-sm flex items-center gap-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <Bluetooth size={15} />} {tr('Conectar')}</button>
        )}
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
      <p className="text-xs text-white/60">{tr('Los pedales que funcionan como teclado (flechas o AvPag) se emparejan desde los ajustes Bluetooth del teléfono y cambian de página automáticamente en el Modo En Vivo. Para pedales BLE, conectá el dispositivo aquí.')}</p>
    </div>
  );
}