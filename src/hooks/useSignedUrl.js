import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Cache module-level: uri -> signed_url. Evita regenerar URLs firmadas
// para el mismo uri en múltiples componentes y renders.
const cache = new Map();
const EXPIRES_IN = 3600; // 1 hora

// Devuelve true si el valor es un file_uri privado (no una URL http pública).
export function isPrivateUri(uri) {
  return !!uri && !/^https?:\/\//i.test(uri);
}

export default function useSignedUrl(uri) {
  const [url, setUrl] = useState(() => {
    if (!uri) return null;
    if (!isPrivateUri(uri)) return uri;
    return cache.get(uri) || null;
  });

  useEffect(() => {
    if (!uri) { setUrl(null); return; }
    if (!isPrivateUri(uri)) { setUrl(uri); return; }
    if (cache.has(uri)) { setUrl(cache.get(uri)); return; }
    let cancelled = false;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: EXPIRES_IN })
      .then(({ signed_url }) => {
        if (cancelled) return;
        cache.set(uri, signed_url);
        setUrl(signed_url);
      })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [uri]);

  return url;
}