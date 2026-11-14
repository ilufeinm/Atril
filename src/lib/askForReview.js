// Pide la calificación en Google Play al salir del Modo En Vivo, solo en la app de Android.
// La regla de cuándo pedir está en reviewPolicy.js. La ventana es la de Google (In-App Review):
// no saca al músico de Atril y Google decide si la muestra.
import { InAppReview } from '@capacitor-community/in-app-review';
import { isNativeApp } from '@/lib/nativeFiles';
import { reviewDecision } from '@/lib/reviewPolicy';

const KEY = 'atril-review';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sin almacenamiento: no se pide */ } };

// Se llama cuando termina una sesión del Modo En Vivo (al salir de la pantalla).
export function afterLivePlay({ minutes, songs }) {
  if (!isNativeApp()) return;
  const { state, ask } = reviewDecision(read(), { minutes, songs });
  write(state);
  if (!ask) return;
  // Un momento después de salir: la ventana aparece ya fuera del Modo En Vivo.
  setTimeout(() => {
    InAppReview.requestReview().catch((e) => console.warn('No se pudo pedir la calificación:', e));
  }, 1500);
}
