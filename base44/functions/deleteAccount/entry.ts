import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión' }, { status: 401 });

    const admin = base44.asServiceRole.entities;
    const [songs, sets, bands, recs, bandSongs] = await Promise.all([
      admin.Song.filter({ created_by_id: user.id }),
      admin.Setlist.filter({ created_by_id: user.id }),
      admin.Band.filter({ created_by_id: user.id }),
      admin.Recording.filter({ created_by_id: user.id }),
      admin.BandSong.filter({ created_by_id: user.id }),
    ]);

    const deletions = [];
    if (songs.length) deletions.push(admin.Song.deleteMany({ id: { $in: songs.map((s) => s.id) } }));
    if (sets.length) deletions.push(admin.Setlist.deleteMany({ id: { $in: sets.map((s) => s.id) } }));
    if (bands.length) deletions.push(admin.Band.deleteMany({ id: { $in: bands.map((b) => b.id) } }));
    if (recs.length) deletions.push(admin.Recording.deleteMany({ id: { $in: recs.map((r) => r.id) } }));
    if (bandSongs.length) deletions.push(admin.BandSong.deleteMany({ id: { $in: bandSongs.map((b) => b.id) } }));
    await Promise.all(deletions);

    return Response.json({
      ok: true,
      deleted: {
        songs: songs.length,
        sets: sets.length,
        bands: bands.length,
        recordings: recs.length,
        bandSongs: bandSongs.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}