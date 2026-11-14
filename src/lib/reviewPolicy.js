// Cuándo pedir la calificación en Google Play (regla pura, sin dependencias, para poder probarla sola).
// [Principio Atril] Nunca durante el Modo En Vivo: se pide al salir, después de haber tocado de verdad.
// - Cuenta como "tocar de verdad" una sesión en vivo de 15 minutos o más, o de 3 canciones o más.
// - Se pide recién a partir de la segunda vez que pasa eso.
// - Como mucho una vez cada 120 días. Google además tiene su propio límite y puede no mostrar la ventana.
export const MIN_MINUTES = 15;
export const MIN_SONGS = 3;
export const MIN_PLAYS = 2;
export const EVERY_DAYS = 120;
const DAY = 24 * 60 * 60 * 1000;

// state: { plays, lastAsked } guardado en el dispositivo. Devuelve el estado nuevo y si hay que pedir.
export function reviewDecision(state, { minutes, songs }, now = Date.now()) {
  const s = { plays: state?.plays || 0, lastAsked: state?.lastAsked || 0 };
  if (minutes < MIN_MINUTES && songs < MIN_SONGS) return { state: s, ask: false };
  s.plays += 1;
  if (s.plays < MIN_PLAYS) return { state: s, ask: false };
  if (s.lastAsked && now - s.lastAsked < EVERY_DAYS * DAY) return { state: s, ask: false };
  s.lastAsked = now;
  return { state: s, ask: true };
}
