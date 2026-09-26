import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { invite_code } = await req.json();
    if (!invite_code) return Response.json({ error: 'Código requerido' }, { status: 400 });
    const bands = await base44.asServiceRole.entities.Band.filter({ invite_code });
    const band = bands[0];
    if (!band) return Response.json({ error: 'Código de invitación inválido' }, { status: 404 });
    return Response.json({ band: { id: band.id, name: band.name, description: band.description, image_url: band.image_url, members: band.members, invite_code: band.invite_code } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}