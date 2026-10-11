import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';

// Esquema propio de la app Android (debe coincidir con el intent-filter del AndroidManifest).
export const APP_SCHEME = 'com.scorebook.musicapp';

export const isNativeApp = () =>
  typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

// Solo permite rutas internas ("/algo"), nunca URLs externas.
export const safeNext = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
};

// Login con Google. En la app Android se abre en Chrome (Google bloquea los WebView)
// y Supabase devuelve la sesión a la app con un enlace profundo; en el navegador
// funciona con una redirección normal.
export async function loginWithGoogle(returnTo = '/') {
  if (!isNativeApp()) {
    await base44.auth.loginWithProvider('google', returnTo);
    return;
  }
  const redirectTo = `${APP_SCHEME}://auth?next=${encodeURIComponent(safeNext(returnTo))}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) { console.error('No se pudo iniciar el login con Google:', error); return; }
  try {
    await window.Capacitor.Plugins.Browser.open({ url: data.url });
  } catch (e) {
    console.error('No se pudo abrir el navegador para el login:', e);
    window.location.href = data.url;
  }
}

// Escucha el regreso desde Chrome:
// com.scorebook.musicapp://auth?next=/...#access_token=...&refresh_token=...
export function initNativeAuthListener() {
  if (!isNativeApp()) return () => {};
  const AppPlugin = window.Capacitor.Plugins?.App;
  if (!AppPlugin?.addListener) return () => {};

  let handle = null;
  let removed = false;

  // addListener puede devolver una promesa o el handle directo según el plugin: se normaliza.
  Promise.resolve(AppPlugin.addListener('appUrlOpen', async ({ url }) => {
    try {
      if (!url || !url.startsWith(`${APP_SCHEME}://auth`)) return;
      const u = new URL(url);
      const hash = new URLSearchParams(u.hash.replace(/^#/, ''));
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      const next = safeNext(u.searchParams.get('next'));
      if (!access_token || !refresh_token) return;
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      try { await window.Capacitor.Plugins.Browser?.close?.(); } catch (_) { /* no-op en Android */ }
      window.location.href = next;
    } catch (e) {
      console.error('Error al completar el login desde el navegador:', e);
    }
  })).then((h) => {
    if (removed) h?.remove?.();
    else handle = h;
  }).catch(() => {});

  return () => {
    removed = true;
    handle?.remove?.();
  };
}
