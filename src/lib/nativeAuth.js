import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

// Origen de la web publicada: ahí vive la página puente /auth-bridge.
const WEB_ORIGIN = 'https://atril.base44.app';
// Esquema propio de la app Android (debe coincidir con el intent-filter del AndroidManifest).
export const APP_SCHEME = 'com.scorebook.musicapp';

export const isNativeApp = () =>
  typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

// Solo permite rutas internas ("/algo"), nunca URLs externas.
export const safeNext = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
};

// Login con Google. En la app Android se abre en Chrome (Google bloquea los WebView);
// en el navegador funciona igual que antes.
export async function loginWithGoogle(returnTo = '/') {
  if (!isNativeApp()) {
    base44.auth.loginWithProvider('google', returnTo);
    return;
  }
  const bridge = `${WEB_ORIGIN}/auth-bridge?next=${encodeURIComponent(safeNext(returnTo))}`;
  const base = appParams.appBaseUrl || WEB_ORIGIN;
  const url = `${base}/api/apps/auth/login?app_id=${appParams.appId}&from_url=${encodeURIComponent(bridge)}`;
  try {
    await window.Capacitor.Plugins.Browser.open({ url });
  } catch (e) {
    console.error('No se pudo abrir el navegador para el login:', e);
    window.location.href = url;
  }
}

// Escucha el regreso desde Chrome (com.scorebook.musicapp://auth?token=...&next=...).
export function initNativeAuthListener() {
  if (!isNativeApp()) return () => {};
  const AppPlugin = window.Capacitor.Plugins?.App;
  if (!AppPlugin?.addListener) return () => {};

  let handle = null;
  let removed = false;

  AppPlugin.addListener('appUrlOpen', async ({ url }) => {
    try {
      if (!url || !url.startsWith(`${APP_SCHEME}://auth`)) return;
      const u = new URL(url);
      const token = u.searchParams.get('token');
      const next = safeNext(u.searchParams.get('next'));
      if (!token) return;
      base44.auth.setToken(token);
      try { await window.Capacitor.Plugins.Browser?.close?.(); } catch (_) { /* no-op en Android */ }
      window.location.href = next;
    } catch (e) {
      console.error('Error al completar el login desde el navegador:', e);
    }
  }).then((h) => {
    if (removed) h.remove();
    else handle = h;
  });

  return () => {
    removed = true;
    handle?.remove?.();
  };
}
