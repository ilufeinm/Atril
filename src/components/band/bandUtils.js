export function parseMembers(membersJson) { try { return JSON.parse(membersJson || '[]'); } catch { return []; } }
export function roleOf(members, userId) { const m = (members || []).find((x) => x.user_id === userId); return m ? m.role : null; }
export function isDirector(band, userId) { return !!userId && band?.created_by_id === userId; }
export function isEditor(band, members, userId) { if (isDirector(band, userId)) return true; return roleOf(members, userId) === 'editor'; }
export function isMember(band, members, userId) { if (isDirector(band, userId)) return true; return !!roleOf(members, userId); }
export const ROLE_LABEL = { director: 'Director', editor: 'Editor', member: 'Integrante' };