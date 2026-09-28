export const MARKER_LABELS = ['Intro', 'A', 'B', 'Solo', 'Estribillo', 'Final'];

export const DEFAULTS = {
  lapiz: { color: '#dc9050', grosor: 4 },
  resaltador: { color: '#ffd54a', grosor: 22, opacidad: 0.4 },
  texto: { color: '#1a1a1a', size: 32, style: 'normal' },
  flecha: { color: '#dc9050', grosor: 4 },
  forma: { color: '#dc9050', grosor: 4 },
  marcador: { label: 'A', color: '#8e9aaf' },
};

export const SWATCHES = ['#dc9050', '#ff4d4d', '#4d9bff', '#36c98a', '#ffd54a', '#1a1a1a', '#ffffff', '#b06bff'];
export const GROSOR_PRESETS = [2, 4, 8, 14];
export const OPAC_PRESETS = [0.2, 0.4, 0.6];
export const TEXT_SIZES = [20, 28, 36, 48];
export const TEXT_STYLES = [{ id: 'normal', label: 'A' }, { id: 'bold', label: 'B' }, { id: 'italic', label: 'I' }];

export const isDrawingTool = (t) => ['lapiz', 'resaltador', 'flecha', 'forma'].includes(t);

export function pointToSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function hitTest(items, x, y, threshold = 22) {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    const p = it.points || [];
    if (it.tool === 'marcador') {
      if (p[0] && Math.hypot(p[0][0] - x, p[0][1] - y) < 55) return i;
      continue;
    }
    if (it.tool === 'texto') {
      if (p[0] && Math.abs(p[0][0] - x) < 90 && Math.abs(p[0][1] - y) < 55) return i;
      continue;
    }
    if (it.tool === 'forma') {
      const x1 = Math.min(p[0][0], p.at(-1)[0]), y1 = Math.min(p[0][1], p.at(-1)[1]);
      const x2 = Math.max(p[0][0], p.at(-1)[0]), y2 = Math.max(p[0][1], p.at(-1)[1]);
      if (x >= x1 - threshold && x <= x2 + threshold && y >= y1 - threshold && y <= y2 + threshold) return i;
      continue;
    }
    for (let k = 0; k < p.length - 1; k++) {
      if (pointToSegDist(x, y, p[k][0], p[k][1], p[k + 1][0], p[k + 1][1]) < threshold + (it.grosor || 4)) return i;
    }
    if (p.length === 1 && Math.hypot(p[0][0] - x, p[0][1] - y) < threshold) return i;
  }
  return -1;
}