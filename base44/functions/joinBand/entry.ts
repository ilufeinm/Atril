import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { parseMembers, buildMemberIds, buildEditorIds, propagateMembership } from '../../shared/bandUtils.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    const { invite_code, instrument } = await req.json();
    if (!invite_code) return Response.json({ error: 'Código de invitación requerido' }, { status: 400 });
    const bands = await base44.asServiceRole.entities.Band.filter({ invite_code });
    const band = bands[0];
    if (!band) return Response.json({ error: 'Código de invitación inválido' }, { status: 404 });
    const members = parseMembers(band.members);
    if (members.find((m) => m.user_id === user.id)) return Response.json({ band, already: true });
    members.push({ user_id: user.id, name: user.full_name || user.email, instrument: instrument || 'Otro', role: 'member', color: '#94a3b8' });
    const member_ids = buildMemberIds(members);
    const editor_ids = buildEditorIds(members);
    const updated = await base44.asServiceRole.entities.Band.update(band.id, { members: JSON.stringify(members), member_ids, editor_ids });
    await propagateMembership(base44, band.id, member_ids, editor_ids);
    return Response.json({ band: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}