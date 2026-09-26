import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { parseMembers, buildMemberIds, buildEditorIds, propagateMembership } from '../../shared/bandUtils.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    const { band_id, user_id, action } = await req.json();
    if (!band_id || !action) return Response.json({ error: 'Faltan datos' }, { status: 400 });
    const band = await base44.asServiceRole.entities.Band.get(band_id);
    if (!band) return Response.json({ error: 'Banda no encontrada' }, { status: 404 });
    if (band.created_by_id !== user.id) return Response.json({ error: 'Solo el director puede gestionar integrantes' }, { status: 403 });

    if (action === 'toggle_delete') {
      const next = !band.allow_editor_delete;
      await base44.asServiceRole.entities.Band.update(band_id, { allow_editor_delete: next });
      return Response.json({ ok: true, allow_editor_delete: next });
    }

    const members = parseMembers(band.members);
    if (!user_id) return Response.json({ error: 'Integrante no especificado' }, { status: 400 });
    const target = members.find((m) => m.user_id === user_id);
    if (!target) return Response.json({ error: 'Integrante no encontrado' }, { status: 404 });
    if (target.role === 'director' || user_id === band.created_by_id) return Response.json({ error: 'No se puede modificar al director' }, { status: 400 });

    let next = members;
    if (action === 'promote_editor') target.role = 'editor';
    else if (action === 'demote') target.role = 'member';
    else if (action === 'remove') next = members.filter((m) => m.user_id !== user_id);
    else return Response.json({ error: 'Acción no válida' }, { status: 400 });

    const member_ids = buildMemberIds(next);
    const editor_ids = buildEditorIds(next);
    await base44.asServiceRole.entities.Band.update(band_id, { members: JSON.stringify(next), member_ids, editor_ids });
    await propagateMembership(base44, band_id, member_ids, editor_ids);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}