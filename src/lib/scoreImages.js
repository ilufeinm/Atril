import * as pdfjsLib from 'pdfjs-dist';
// Vite resuelve el worker como URL estática
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_WIDTH = 1600;
const THUMB_SIZE = 240;
const QUALITY = 0.82;

let _webpOk;
function canWebp() {
  if (_webpOk === undefined) {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    _webpOk = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return _webpOk;
}
function imgType() { return canWebp() ? 'image/webp' : 'image/jpeg'; }
function ext() { return canWebp() ? 'webp' : 'jpg'; }

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new globalThis.Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

// Comprime una imagen (File/Blob) a WebP/JPEG con ancho máximo.
// Devuelve { blob, width, height }.
export async function compressImage(file, max = MAX_WIDTH, quality = QUALITY) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = img.naturalWidth > max ? max / img.naturalWidth : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, imgType(), quality);
    return { blob, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Genera una miniatura recortada al cuadrado (~size×size) desde un Blob/imagen.
export async function makeThumbnail(file, size = THUMB_SIZE) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
    return canvasToBlob(canvas, imgType(), 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Convierte un PDF (File/Blob) en un array de blobs de imagen, una página por blob.
// onProgress(done, total) se invoca tras cada página renderizada.
export async function pdfToImages(file, { max = MAX_WIDTH, quality = QUALITY, onProgress } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const data = await fetch(url).then((r) => r.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const total = pdf.numPages;
    const blobs = [];
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const viewport1 = page.getViewport({ scale: 1 });
      const scale = viewport1.width > max ? max / viewport1.width : 1;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await canvasToBlob(canvas, imgType(), quality);
      blobs.push(blob);
      onProgress?.(i, total);
    }
    return blobs;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export { ext as imgExt };