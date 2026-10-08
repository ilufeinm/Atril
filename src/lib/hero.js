// Transición de elemento compartido entre la biblioteca y el visor (estilo Fotos / Apple Music).
// Las rutas de Atril viven en árboles distintos (StageShell vs. visor a pantalla completa), así que
// en vez de depender de `layoutId` se usa una capa superpuesta (HeroLayer) que "viaja" de la
// miniatura a pantalla completa y vuelve. Este módulo es el puente entre quien dispara y la capa.

const listeners = new Set();
let state = null;
let last = null; // { id, src } de la última miniatura abierta (para la vuelta)

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const emit = (s) => { state = s; listeners.forEach((l) => l(s)); };

export const subscribeHero = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// Se llama al tocar una partitura, justo antes de navegar.
export function heroIn(id, el, src) {
  if (reduced() || !el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  last = { id, src };
  let resolve; const revealed = new Promise((res) => { resolve = res; });
  emit({ mode: 'in', id, src, key: Date.now(), from: { left: r.left, top: r.top, width: r.width, height: r.height }, revealed, resolve });
  return true;
}

// El visor avisa que ya mostró la partitura: la capa puede desvanecerse.
export function heroReveal(id) {
  if (state?.mode === 'in' && state.id === id) state.resolve?.();
}

// Se llama al salir del visor, justo antes de navegar de vuelta.
export function heroOut(id) {
  if (reduced() || !last || last.id !== id) return false;
  emit({ mode: 'out', id, src: last.src, key: Date.now() });
  return true;
}
