import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { parseMembers, roleOf } from '../../shared/bandUtils.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    const { band_id, song_id } = await req.json();
    if (!band_id || !song_id) return Response.json({ error: 'Faltan datos' }, { status: 400 });
    const band = await base44.asServiceRole.entities.Band.get(band_id);
    if (!band) return Response.json({ error: 'Banda no encontrada' }, { status: 404 });
    const members = parseMembers(band.members);
    const director = band.created_by_id === user.id;
    const editor = roleOf(members, user.id) === 'editor';
    if (!director && !editor) return Response.json({ error: 'No tenés permiso' }, { status: 403 });
    if (editor && !director && !band.allow_editor_delete) return Response.json({ error: 'El director no habilitó la eliminación de partituras' }, { status: 403 });

    const sets = await base44.asServiceRole.entities.Setlist.filter({ band_id });
    for (const s of sets) {
      if (Array.isArray(s.song_ids) && s.song_ids.includes(song_id)) {
        await base44.asServiceRole.entities.Setlist.update(s.id, { song_ids: s.song_ids.filter((x) => x !== song_id) });
      }
    }
    await base44.asServiceRole.entities.BandSong.delete(song_id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}