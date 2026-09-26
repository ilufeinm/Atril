import { useState, useEffect } from 'react';

let device = null;
let state = { connected: false, name: '' };
const subs = new Set();
const handlers = { next: null, prev: null };

const emit = () => subs.forEach((f) => f(state));

export async function connectPedal() {
  if (!navigator.bluetooth) throw new Error('Tu navegador no soporta Bluetooth');
  device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['battery_service', 'device_information'] });
  state = { connected: true, name: device.name || 'Pedal' };
  emit();
  device.addEventListener('gattserverdisconnected', () => { state = { connected: false, name: '' }; emit(); });
  try {
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices().catch(() => []);
    for (const s of services) {
      const chars = await s.getCharacteristics().catch(() => []);
      for (const c of chars) {
        if (c.properties.notify) {
          await c.startNotifications().catch(() => {});
          c.addEventListener('characteristicvaluechanged', (e) => {
            const v = e.target.value;
            const val = v.getUint8 ? v.getUint8(0) : 0;
            if (val === 0 || val === 1) handlers.next?.();
            else if (val === 2 || val === 3) handlers.prev?.();
          });
        }
      }
    }
  } catch (e) { /* connection ok even if no notifiable characteristic */ }
}

export function disconnectPedal() {
  if (device?.gatt?.connected) device.gatt.disconnect();
  state = { connected: false, name: '' };
  emit();
}

export function setPedalHandlers({ next, prev }) {
  handlers.next = next;
  handlers.prev = prev;
}

export function useBluetoothPedal() {
  const [s, setS] = useState(state);
  useEffect(() => { const f = (v) => setS(v); subs.add(f); setS(state); return () => subs.delete(f); }, []);
  return { ...s, connect: connectPedal, disconnect: disconnectPedal };
}