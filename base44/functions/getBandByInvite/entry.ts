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

    // Preview del repertorio en vivo: solo metadatos (título/artista), sin archivos de partituras
    let setlistPreview = null;
    if (band.live_setlist_id) {
      const setlist = await base44.asServiceRole.entities.Setlist.get(band.live_setlist_id).catch(() => null);
      if (setlist) {
        const ids = setlist.song_ids || [];
        let ordered = [];
        if (ids.length) {
          const [songs, bandSongs] = await Promise.all([
            base44.asServiceRole.entities.Song.filter({ id: { $in: ids } }),
            base44.asServiceRole.entities.BandSong.filter({ id: { $in: ids }, band_id: band.id })
          ]);
          const all = [...songs, ...bandSongs];
          ordered = ids.map((sid) => all.find((s) => s.id === sid)).filter(Boolean);
        }
        setlistPreview = {
          name: setlist.name,
          songs: ordered.map((s) => ({ title: s.title, artist: s.artist || '' }))
        };
      }
    }

    return Response.json({
      band: {
        name: band.name,
        invite_code: band.invite_code,
        is_member: isMember,
        band_id: isMember ? band.id : undefined,
        setlist: setlistPreview
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}