// Restaurar una copia de seguridad sin duplicar lo que ya está en la cuenta.
// Una partitura ya existe si coincide el título y el archivo; un repertorio, si coincide el nombre y la fecha.
// Los repertorios restaurados apuntan a los ids actuales de sus partituras (los de la copia pueden no existir más).

const norm = (v) => String(v ?? '').trim().toLowerCase();
export const songKey = (s) => `${norm(s?.title)}|${s?.file_url || ''}`;
export const setKey = (x) => `${norm(x?.name)}|${x?.date || ''}`;

// Saca los campos que pone la base de datos, para crear filas nuevas.
export const stripRow = (r) => {
  const { id, created_date, updated_date, created_by_id, ...rest } = r || {};
  return rest;
};

// Partituras de la copia que todavía no están en la cuenta (sin repetir dentro de la copia).
export function songsToRestore(backupSongs, existingSongs) {
  const existing = new Set((existingSongs || []).map(songKey));
  const seen = new Set();
  return (backupSongs || []).filter((s) => {
    const k = songKey(s);
    if (existing.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// id en la copia → id actual, usando las partituras que ya estaban más las recién creadas.
export function songIdMap(backupSongs, existingSongs, createdSongs) {
  const byKey = new Map();
  for (const s of [...(existingSongs || []), ...(createdSongs || [])]) if (!byKey.has(songKey(s))) byKey.set(songKey(s), s.id);
  const map = new Map();
  for (const s of backupSongs || []) {
    const id = byKey.get(songKey(s));
    if (s?.id && id) map.set(s.id, id);
  }
  return map;
}

// Repertorios de la copia que todavía no están, listos para crear, con los ids de partituras actualizados.
export function setsToRestore(backupSets, existingSets, idMap) {
  const existing = new Set((existingSets || []).map(setKey));
  const seen = new Set();
  return (backupSets || [])
    .filter((x) => {
      const k = setKey(x);
      if (existing.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((x) => ({ ...stripRow(x), song_ids: (x.song_ids || []).map((id) => idMap.get(id) || id) }));
}
