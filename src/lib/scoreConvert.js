import { base44 } from '@/api/base44Client';
import { compressImage, makeThumbnail, pdfToImages, imgExt } from './scoreImages';
import { isPrivateUri } from '@/hooks/useSignedUrl';

// Conversión en vuelo por partitura: evita duplicar trabajo si el visor
// y la biblioteca disparan la conversión a la vez.
const inflight = new Map(); // songId -> Promise<result>

async function getSigned(uri) {
  if (!isPrivateUri(uri)) return uri;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
  return signed_url;
}

async function fetchBlob(uri) {
  const url = await getSigned(uri);
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo descargar el archivo original.');
  return res.blob();
}

function uploadBlob(blob, filename) {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  return base44.integrations.Core.UploadPrivateFile({ file }).then((r) => r.file_uri);
}

// Convierte una partitura existente (PDF o imagen) a páginas optimizadas.
// No sobrescribe file_url. Persiste page_urls, pages y thumb_url.
// onProgress(done, total). Devuelve { page_urls, thumb_url, pages }.
export async function convertSongPages(song, { onProgress } = {}) {
  if (!song?.id) throw new Error('Falta la partitura.');
  if (!song.file_url) throw new Error('La partitura no tiene archivo.');
  if (inflight.has(song.id)) return inflight.get(song.id);

  const task = (async () => {
    const isPdf = song.file_url.toLowerCase().includes('.pdf');
    const original = await fetchBlob(song.file_url);

    let pageBlobs;
    if (isPdf) {
      pageBlobs = await pdfToImages(original, { onProgress: (d, t) => onProgress?.(d, t) });
    } else {
      pageBlobs = [await compressImage(original)];
      onProgress?.(1, 1);
    }

    const page_urls = [];
    for (let i = 0; i < pageBlobs.length; i++) {
      page_urls.push(await uploadBlob(pageBlobs[i], `page-${i + 1}.${imgExt()}`));
    }

    const thumbBlob = await makeThumbnail(pageBlobs[0]);
    const thumb_url = await uploadBlob(thumbBlob, `thumb.${imgExt()}`);

    const pages = page_urls.length;
    const patch = { page_urls, thumb_url, pages };
    await base44.entities.Song.update(song.id, patch);
    return patch;
  })().finally(() => inflight.delete(song.id));

  inflight.set(song.id, task);
  return task;
}

export function isConverting(songId) { return inflight.has(songId); }