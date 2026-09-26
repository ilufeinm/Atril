export function parseMembers(membersJson) {
  try { return JSON.parse(membersJson || '[]'); } catch { return []; }
}
export function buildMemberIds(members) {
  return (members || []).map((m) => m.user_id).filter(Boolean);
}
export function buildEditorIds(members) {
  return (members || []).filter((m) => m.role === 'director' || m.role === 'editor').map((m) => m.user_id).filter(Boolean);
}
export function roleOf(members, userId) {
  const m = (members || []).find((x) => x.user_id === userId);
  return m ? m.role : null;
}
export function isEditor(members, userId, bandCreatedById) {
  if (userId === bandCreatedById) return true;
  return roleOf(members, userId) === 'editor';
}
export async function propagateMembership(base44, bandId, memberIds, editorIds) {
  const sets = await base44.asServiceRole.entities.Setlist.filter({ band_id: bandId });
  if (sets.length) await base44.asServiceRole.entities.Setlist.bulkUpdate(sets.map((s) => ({ id: s.id, member_ids: memberIds, editor_ids: editorIds })));
  const songs = await base44.asServiceRole.entities.BandSong.filter({ band_id: bandId });
  if (songs.length) await base44.asServiceRole.entities.BandSong.bulkUpdate(songs.map((s) => ({ id: s.id, member_ids: memberIds, editor_ids: editorIds })));
}