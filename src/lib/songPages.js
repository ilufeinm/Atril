// Helpers para resolver páginas lógicas vs físicas de una partitura.
// Una canción puede ser:
//   - Multi-imagen: page_urls = [url1, url2, ...] (una hoja por imagen)
//   - PDF de varias páginas: file_url + page_order = [física1, física2, ...]
//   - Imagen única: file_url (sin page_order)
//   - Texto: sin file_url

// Número de páginas lógicas (las que el usuario navega y reordena).
export function getPageCount(song) {
  if (song?.page_urls?.length) return song.page_urls.length;
  return song?.pages || 1;
}

// Resuelve la fuente a mostrar para una página lógica (1-indexed).
// Devuelve { kind: 'image' | 'pdf' | 'text', src } donde:
//   - image: src = URL de la imagen a mostrar
//   - pdf:   src = número de página física del PDF
//   - text:  src = null
export function resolvePage(song, page) {
  if (song?.page_urls?.length) {
    return { kind: 'image', src: song.page_urls[page - 1] || song.page_urls[0] };
  }
  if (song?.file_url) {
    const isPdf = song.file_url.toLowerCase().includes('.pdf');
    if (isPdf) {
      const order = song?.page_order || [];
      return { kind: 'pdf', src: order[page - 1] || page };
    }
    return { kind: 'image', src: song.file_url };
  }
  return { kind: 'text', src: null };
}