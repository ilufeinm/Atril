// Mantener la pantalla encendida en el Modo En Vivo.
// - App de Android: plugin nativo (@capacitor-community/keep-awake). Le dice al sistema "no apagar la pantalla"
//   mientras la app esté abierta; es lo confiable dentro del WebView.
// - Web: Screen Wake Lock del navegador. El navegador lo suelta cada vez que la página pasa a segundo plano
//   (una notificación, un llamado, cambiar de app), así que se vuelve a pedir al volver.
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

const isNative = () => Capacitor.isNativePlatform();
let wanted = false;
let webLock = null;

async function requestWeb() {
  if (webLock || typeof navigator === 'undefined' || !navigator.wakeLock?.request) return;
  if (document.visibilityState !== 'visible') return;
  try {
    webLock = await navigator.wakeLock.request('screen');
    webLock.addEventListener?.('release', () => { webLock = null; });
  } catch { /* el navegador no lo permite ahora (p. ej. batería baja): se reintenta al volver */ }
}

function onVisibility() {
  if (!wanted || document.visibilityState !== 'visible') return;
  if (isNative()) KeepAwake.keepAwake().catch(() => {});
  else requestWeb();
}

export async function startKeepAwake() {
  wanted = true;
  document.addEventListener('visibilitychange', onVisibility);
  if (isNative()) {
    try { await KeepAwake.keepAwake(); } catch { /* sin plugin: la pantalla sigue la configuración del teléfono */ }
  } else {
    await requestWeb();
  }
}

export async function stopKeepAwake() {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibility);
  if (isNative()) { try { await KeepAwake.allowSleep(); } catch { /* nada que liberar */ } }
  if (webLock) { try { await webLock.release(); } catch { /* ya liberado */ } webLock = null; }
}

// Para pruebas: ¿hay un bloqueo activo ahora?
export function isKeepAwakeActive() {
  return isNative() ? wanted : !!webLock;
}
