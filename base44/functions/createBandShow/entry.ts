import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { parseMembers, buildMemberIds, buildEditorIds, isEditor } from '../../shared/bandUtils.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    const { band_id, name, venue, date, time } = await req.json();
    if (!band_id || !name || !name.trim()) return Response.json({ error: 'Nombre y banda son obligatorios' }, { status: 400 });
    const band = await base44.asServiceRole.entities.Band.get(band_id);
    if (!band) return Response.json({ error: 'Banda no encontrada' }, { status: 404 });
    const members = parseMembers(band.members);
    if (!isEditor(members, user.id, band.created_by_id)) return Response.json({ error: 'Solo el director o un editor pueden crear shows' }, { status: 403 });
    const member_ids = buildMemberIds(members);
    const editor_ids = buildEditorIds(members);
    const set = await base44.asServiceRole.entities.Setlist.create({ name: name.trim(), venue: (venue || '').trim(), date: date || '', time: time || '', band_id, song_ids: [], member_ids, editor_ids });
    return Response.json({ set });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}