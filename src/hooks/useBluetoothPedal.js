import { useState, useEffect } from 'react';

let device = null;
let state = { connected: false, name: '' };
const subs = new Set();
const handlers = { next: null, prev: null };

const emit = () => subs.forEach((f) => f(state));

// Servicios BLE usados por pedales de paginación comunes (AirTurn, PageFlip,
// Coda, pedales genéricos HM-10/CC41). Incluirlos en optionalServices permite
// al navegador leer sus características; sin ellos, el dispositivo se "ve"
// pero no se puede interpretar nada.
const PEDAL_SERVICES = [
  'battery_service',
  'device_information',
  'human_interface_device', // HID — PageFlip y similares
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC41 (AirTurn, genéricos)
  '0000fff0-0000-1000-8000-00805f9b34fb', // variante común
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // UART-style (Nordic)
];

export function isBluetoothSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

export async function connectPedal() {
  if (!navigator.bluetooth) {
    const e = new Error('Tu navegador no soporta Bluetooth');
    e.code = 'unsupported';
    throw e;
  }
  device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PEDAL_SERVICES,
  });
  device.addEventListener('gattserverdisconnected', () => {
    state = { connected: false, name: '' };
    emit();
  });
  // Solo se marca "conectado" cuando la conexión realmente se estableció.
  let server;
  try {
    server = await device.gatt.connect();
  } catch (e) {
    try { device.gatt.disconnect(); } catch { /* ignore */ }
    state = { connected: false, name: '' };
    emit();
    const err = new Error('No se pudo conectar el pedal. Si funciona como teclado, emparejalo desde los ajustes Bluetooth del teléfono.');
    err.code = 'connect-failed';
    throw err;
  }
  let notifiableFound = false;
  try {
    const services = await server.getPrimaryServices().catch(() => []);
    for (const s of services) {
      // Batería e información del dispositivo también "notifican", pero no son botones del pedal.
      if (/^0000180[af]-/.test(s.uuid)) continue;
      const chars = await s.getCharacteristics().catch(() => []);
      for (const c of chars) {
        if (c.properties.notify) {
          notifiableFound = true;
          await c.startNotifications().catch(() => {});
          c.addEventListener('characteristicvaluechanged', (e) => {
            const v = e.target.value;
            const val = v.getUint8 ? v.getUint8(0) : 0;
            // Interpretación robusta: la mayoría de los pedales envían
            // 0/1 = siguiente página, 2/3 = página anterior. Algunos
            // modelos envían 1/2 directamente. Cualquier valor alto se ignora.
            if (val === 0 || val === 1) handlers.next?.();
            else if (val === 2 || val === 3) handlers.prev?.();
          });
        }
      }
    }
  } catch (e) {
    /* no se pudieron leer los servicios: se trata como pedal sin botones legibles */
  }
  if (!notifiableFound) {
    // Sin botones legibles: casi seguro es un pedal tipo teclado (HID). Hay que SOLTARLO:
    // mientras el navegador lo tiene conectado, el pedal deja de anunciarse y el
    // teléfono no lo encuentra para emparejarlo (y antes la app decía "conectado" igual).
    try { device.gatt.disconnect(); } catch { /* ignore */ }
    state = { connected: false, name: '' };
    emit();
    const err = new Error('Este pedal funciona como teclado. Emparejalo desde los ajustes Bluetooth del teléfono (no desde acá) y va a cambiar de página en el Modo En Vivo.');
    err.code = 'keyboard-pedal';
    throw err;
  }
  state = { connected: true, name: device.name || 'Pedal' };
  emit();
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
  return { ...s, connect: connectPedal, disconnect: disconnectPedal, supported: isBluetoothSupported() };
}