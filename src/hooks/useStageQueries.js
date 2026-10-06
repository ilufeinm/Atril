import { useQuery, useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Campos livianos para listados: excluye contenido pesado (content, annotations, notes, intro, structure).
const SLIM_FIELDS = [
  'title', 'artist', 'composer', 'key', 'bpm', 'meter', 'type', 'folder', 'tags',
  'favorite', 'file_url', 'page_urls', 'page_order', 'pages', 'duration', 'last_page',
  'font_scale', 'is_demo', 'thumb_url', 'created_by_id', 'created_date', 'updated_date',
];

export const SONGS_KEY = ['songs', 'slim'];
export const USER_KEY = ['user', 'me'];
export const SETS_KEY = ['sets'];
export const BANDS_KEY = ['bands'];
export const RECORDINGS_KEY = ['recordings'];

function readCache(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}
function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

export function useSongsQuery() {
  return useQuery({
    queryKey: SONGS_KEY,
    queryFn: async () => {
      try {
        const page = await base44.entities.Song.filter({}, { sort: '-updated_date', limit: 1000, fields: SLIM_FIELDS });
        const items = page.items || page;
        writeCache('stage-cache-songs', { songs: items, ts: Date.now() });
        return items;
      } catch (e) {
        const c = readCache('stage-cache-songs');
        if (c?.songs) return c.songs;
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000,
    initialData: () => { const c = readCache('stage-cache-songs'); return c?.songs || undefined; },
  });
}

export function useUserQuery() {
  return useQuery({
    queryKey: USER_KEY,
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetsQuery(enabled) {
  return useQuery({
    queryKey: SETS_KEY,
    queryFn: () => base44.entities.Setlist.list('-updated_date'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBandsQuery(enabled) {
  return useQuery({
    queryKey: BANDS_KEY,
    queryFn: () => base44.entities.Band.list('-updated_date'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordingsQuery(enabled) {
  return useQuery({
    queryKey: RECORDINGS_KEY,
    queryFn: () => base44.entities.Recording.list('-updated_date'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Carga registros completos (con annotations, content, etc.) para las partituras
// que se van a presentar. Mezclar con el listado liviano en el consumidor.
export function useFullSongs(ids) {
  const list = ids || [];
  const queries = useQueries({
    queries: list.map((id) => ({
      queryKey: ['song', 'full', id],
      queryFn: () => base44.entities.Song.get(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    })),
  });
  const fullMap = {};
  list.forEach((id, i) => { if (queries[i]?.data) fullMap[id] = queries[i].data; });
  const ready = list.length === 0 || queries.every((q) => q.isSuccess || q.isError);
  return { fullMap, ready };
}