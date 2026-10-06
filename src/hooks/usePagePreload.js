import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { isPrivateUri } from '@/hooks/useSignedUrl';

// Cache de páginas: uri -> { signedUrl, img, w, h, ts }
const cache = new Map();
const SIGN_TTL = 50 * 60 * 1000; // 50 min
const WINDOW = 1; // pre cargar N-1 y N+1

async function ensureSigned(uri) {
  const e = cache.get(uri);
  if (e && Date.now() - e.ts < SIGN_TTL) return e.signedUrl;
  const signed = isPrivateUri(uri)
    ? (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })).signed_url
    : uri;
  return signed;
}

async function preloadUri(uri) {
  if (!uri) return;
  const existing = cache.get(uri);
  if (existing && Date.now() - existing.ts < SIGN_TTL && existing.img) return;
  try {
    const signed = await ensureSigned(uri);
    const img = new globalThis.Image();
    img.decoding = 'async';
    img.src = signed;
    await img.decode();
    cache.set(uri, { signedUrl: signed, img, w: img.naturalWidth, h: img.naturalHeight, ts: Date.now() });
  } catch {
    /* ignore */
  }
}

// Pre carga y decodifica las páginas adyacentes a la actual; libera las lejanas.
export function usePagePreload(uris, current) {
  useEffect(() => {
    if (!uris || !uris.length) return;
    const idx = current - 1;
    const from = Math.max(0, idx - WINDOW);
    const to = Math.min(uris.length - 1, idx + WINDOW);
    const targets = [];
    for (let i = from; i <= to; i++) if (uris[i]) targets.push(uris[i]);
    targets.forEach(preloadUri);
    // Liberar imágenes fuera de la ventana (mantiene la URL firmada cacheada)
    uris.forEach((uri, i) => {
      if (uri && (i < from || i > to)) {
        const e = cache.get(uri);
        if (e?.img) { e.img.src = ''; e.img = null; }
      }
    });
  }, [uris ? uris.join('|') : '', current]);
}

export function getPreloadedDimensions(uri) {
  const e = cache.get(uri);
  return e && e.w ? { w: e.w, h: e.h } : null;
}