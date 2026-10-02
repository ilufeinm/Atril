import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
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
    if (band.created_by_id === user.id || members.find((m) => m.user_id === user.id)) return Response.json({ band, already: true });

    members.push({
      user_id: user.id,
      name: user.full_name || user.email,
      instrument: instrument || 'Otro',
      role: 'member',
      color: '#94a3b8',
      joined_at: new Date().toISOString()
    });
    const member_ids = buildMemberIds(members);
    const editor_ids = buildEditorIds(members);
    const updated = await base44.asServiceRole.entities.Band.update(band.id, {
      members: JSON.stringify(members),
      member_ids,
      editor_ids
    });
    await propagateMembership(base44, band.id, member_ids, editor_ids);

    // Referidos: contar músicos distintos que se unieron a las bandas del líder y otorgar Premium cada 5
    const leaderId = band.created_by_id;
    if (leaderId && leaderId !== user.id) {
      try {
        const leaderBands = await base44.asServiceRole.entities.Band.filter({ created_by_id: leaderId });
        const invitedIds = new Set();
        for (const lb of leaderBands) {
          for (const m of parseMembers(lb.members)) {
            if (m.user_id && m.user_id !== leaderId) invitedIds.add(m.user_id);
          }
        }
        const count = invitedIds.size;
        const leader = await base44.asServiceRole.entities.User.get(leaderId);
        const granted = leader.referral_premium_granted || 0;
        const monthsToGrant = Math.floor(count / 5) - granted;
        const updates = { referral_count: count };
        if (monthsToGrant > 0) {
          let base = new Date();
          const existing = leader.premium_until ? new Date(leader.premium_until) : null;
          if (existing && !isNaN(existing.getTime()) && existing > base) base = new Date(existing);
          base.setMonth(base.getMonth() + monthsToGrant);
          updates.premium_until = base.toISOString();
          updates.referral_premium_granted = granted + monthsToGrant;
        }
        await base44.asServiceRole.entities.User.update(leaderId, updates);
      } catch (e) {
        console.error('No se pudo actualizar referidos del líder', e);
      }
    }

    return Response.json({ band: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}