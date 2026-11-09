// Guardar y compartir archivos en la app de Android.
// El navegador interno de Android (WebView) no tiene menú de compartir (navigator.share) ni descargas,
// así que en la app se usan los complementos oficiales de Capacitor. En la web no se usa nada de esto.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNativeApp = () => Capacitor.isNativePlatform();

// Carpeta visible en la app Archivos del teléfono (Documents/Atril).
export const DEVICE_FOLDER = 'Documents/Atril';

// Pedazos de 768 KB (múltiplo de 3, así cada pedazo es base64 válido por sí solo):
// una grabación larga no pasa de una sola vez por el puente entre la web y Android.
const CHUNK = 768 * 1024;

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
  reader.readAsDataURL(blob);
});

async function writeBlob(blob, path, directory) {
  let offset = 0;
  do {
    const data = await blobToBase64(blob.slice(offset, offset + CHUNK));
    if (offset === 0) await Filesystem.writeFile({ path, data, directory, recursive: true });
    else await Filesystem.appendFile({ path, data, directory });
    offset += CHUNK;
  } while (offset < blob.size);
  const { uri } = await Filesystem.getUri({ path, directory });
  return uri;
}

const safeFileName = (name) => (name || 'archivo').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'archivo';
const isCancel = (e) => /cancel/i.test(e?.message || '');

// Abre el menú de compartir del teléfono con el archivo (WhatsApp, Drive, Gmail…).
// Devuelve true si se eligió una app y false si se cerró el menú.
export async function shareFileNative(blob, filename, { title, text } = {}) {
  const uri = await writeBlob(blob, safeFileName(filename), Directory.Cache);
  try {
    await Share.share({ title, text, files: [uri], dialogTitle: title });
    return true;
  } catch (e) {
    if (isCancel(e)) return false;
    throw e;
  }
}

// Comparte un enlace o un texto con el menú del teléfono.
export async function shareLinkNative({ title, text, url }) {
  try {
    await Share.share({ title, text, url, dialogTitle: title });
    return true;
  } catch (e) {
    if (isCancel(e)) return false;
    throw e;
  }
}

// Guarda el archivo en el teléfono (Documents/Atril). Desde Android 11 no hace falta ningún permiso.
// En teléfonos más viejos Android no deja escribir ahí sin permiso: entonces se abre el menú de compartir
// para que el músico elija dónde guardarlo (Drive, Archivos, WhatsApp…).
// Devuelve 'device' (quedó en Documents/Atril), 'shared' (se mandó a otra app) o 'cancelled'.
export async function saveFileNative(blob, filename, { title } = {}) {
  const name = safeFileName(filename);
  try {
    await writeBlob(blob, `Atril/${name}`, Directory.Documents);
    return 'device';
  } catch (e) {
    console.warn('No se pudo guardar en Documents/Atril; se abre el menú de compartir:', e);
    return (await shareFileNative(blob, name, { title })) ? 'shared' : 'cancelled';
  }
}
