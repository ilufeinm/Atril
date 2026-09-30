import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { invite_code } = await req.json();
    if (!invite_code) return Response.json({ error: 'Código requerido' }, { status: 400 });

    const bands = await base44.asServiceRole.entities.Band.filter({ invite_code });
    const band = bands[0];
    if (!band) return Response.json({ error: 'Código de invitación inválido' }, { status: 404 });

    // Detectar si el usuario actual ya es miembro (sin exponer datos sensibles a no-miembros)
    const user = await base44.auth.me().catch(() => null);
    const isMember = !!user && (band.created_by_id === user.id || (band.member_ids || []).includes(user.id));

    return Response.json({
      band: {
        name: band.name,
        invite_code: band.invite_code,
        is_member: isMember,
        band_id: isMember ? band.id : undefined
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}