import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { pageUriList, needsConversion } from '@/lib/songPages';

// Partituras sin conexión. [Principio] "Nadie tiene que descubrir en el show que una partitura necesita internet."
// Guarda las imágenes de las páginas y los datos completos de cada partitura en el almacenamiento del
// dispositivo (Cache Storage: existe en el navegador y en el WebView de la app de Android).
// Estrategia: primero la copia guardada; si no está, se descarga, se guarda y se usa.
const CACHE = 'atril-partituras-v1';
const keyFor = (kind, id) => `https://atril.offline/${kind}/${encodeURIComponent(id)}`;
const isPrivate = (uri) => !!uri && !/^https?:\/\//i.test(uri);
const hasCache = () => typeof caches !== 'undefined';

const objectUrls = new Map(); // uri -> blob: URL (una por sesión, para no crear duplicados)
const pending = new Map();    // uri -> Promise (evita descargar dos veces la misma página)

async function openCache() { return hasCache() ? caches.open(CACHE) : null; }

async function download(uri) {
  const src = isPrivate(uri)
    ? (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 })).signed_url
    : uri;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`No se pudo descargar la página (${res.status})`);
  return res;
}

// Guarda una página en el dispositivo (si no estaba) y devuelve su respuesta guardada.
async function ensureCached(uri) {
  const cache = await openCache();
  const key = keyFor('page', uri);
  const hit = cache && await cache.match(key);
  if (hit) return hit;
  if (pending.has(uri)) return pending.get(uri);
  const p = (async () => {
    const res = await download(uri);
    if (cache) await cache.put(key, res.clone()).catch(() => { /* sin espacio: se sigue usando de la red */ });
    return res;
  })().finally(() => pending.delete(uri));
  pending.set(uri, p);
  return p;
}

// URL lista para <img>: sale del dispositivo si está guardada (funciona sin internet).
export async function getScoreUrl(uri) {
  if (!uri) return null;
  if (objectUrls.has(uri)) return objectUrls.get(uri);
  const res = await ensureCached(uri);
  const url = URL.createObjectURL(await res.blob());
  objectUrls.set(uri, url);
  return url;
}

export function useScoreUrl(uri) {
  const [url, setUrl] = useState(() => (uri && objectUrls.get(uri)) || null);
  useEffect(() => {
    if (!uri) { setUrl(null); return; }
    let cancelled = false;
    getScoreUrl(uri).then((u) => { if (!cancelled) setUrl(u); }).catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [uri]);
  return url;
}

// Datos completos de una partitura (anotaciones, texto…): de la red, y si no hay, la copia guardada.
export async function fetchFullSongOffline(id) {
  const cache = await openCache();
  const key = keyFor('song', id);
  try {
    const song = await base44.entities.Song.get(id);
    if (cache) await cache.put(key, new Response(JSON.stringify(song), { headers: { 'Content-Type': 'application/json' } })).catch(() => {});
    return song;
  } catch (e) {
    const hit = cache && await cache.match(key);
    if (hit) return hit.json();
    throw e;
  }
}

// Descarga y guarda páginas y datos completos de una lista de partituras (lo que no esté guardado ya).
export async function prepareSongsOffline(songs) {
  const list = songs || [];
  const cache = await openCache();
  for (const s of list) {
    if (cache && !(await cache.match(keyFor('song', s.id)))) {
      try { await fetchFullSongOffline(s.id); } catch { /* sin conexión: queda pendiente */ }
    }
  }
  const uris = [...new Set(list.flatMap((s) => pageUriList(s)))];
  let ready = 0;
  for (const uri of uris) {
    try { await ensureCached(uri); ready++; } catch { /* sin conexión o error: queda pendiente */ }
  }
  return { total: uris.length, ready };
}

// ¿Están todas las páginas de estas partituras guardadas en el dispositivo?
export async function areSongsOffline(songs) {
  const cache = await openCache();
  if (!cache) return false;
  // Un PDF que todavía no se convirtió a imágenes necesita internet para prepararse.
  if ((songs || []).some((s) => needsConversion(s))) return false;
  for (const s of songs || []) if (!(await cache.match(keyFor('song', s.id)))) return false;
  const uris = [...new Set((songs || []).flatMap((s) => pageUriList(s)))];
  for (const uri of uris) if (!(await cache.match(keyFor('page', uri)))) return false;
  return true;
}
