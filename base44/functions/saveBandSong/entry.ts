import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { parseMembers, buildMemberIds, buildEditorIds, isEditor } from '../../shared/bandUtils.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    const body = await req.json();
    const { band_id, song_id, title, artist, file_url, content, type, key, bpm, duration, pages, setlist_id } = body || {};
    if (!band_id) return Response.json({ error: 'Falta la banda' }, { status: 400 });
    const band = await base44.asServiceRole.entities.Band.get(band_id);
    if (!band) return Response.json({ error: 'Banda no encontrada' }, { status: 404 });
    const members = parseMembers(band.members);
    if (!isEditor(members, user.id, band.created_by_id)) return Response.json({ error: 'No tenés permiso de editor' }, { status: 403 });

    const clean = {
      title: (title || '').trim(),
      artist: (artist || '').trim(),
      file_url: file_url || '',
      content: content || '',
      type: type || 'Partitura',
      key: key || '',
      bpm: Number(bpm) || 0,
      duration: Number(duration) || 0,
      pages: Number(pages) || 1
    };
    if (!clean.title) return Response.json({ error: 'El título es obligatorio' }, { status: 400 });

    let song;
    if (song_id) {
      song = await base44.asServiceRole.entities.BandSong.update(song_id, clean);
    } else {
      const member_ids = buildMemberIds(members);
      const editor_ids = buildEditorIds(members);
      song = await base44.asServiceRole.entities.BandSong.create({ band_id, ...clean, member_ids, editor_ids });
      if (setlist_id) {
        const set = await base44.asServiceRole.entities.Setlist.get(setlist_id);
        if (set && set.band_id === band_id) {
          await base44.asServiceRole.entities.Setlist.update(setlist_id, { song_ids: [...(set.song_ids || []), song.id] });
        }
      }
    }
    return Response.json({ song });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}