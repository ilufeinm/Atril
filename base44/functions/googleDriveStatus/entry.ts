import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
      const r = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (r.ok) {
        const data = await r.json();
        return Response.json({ connected: true, email: data.user?.emailAddress });
      }
      return Response.json({ connected: false });
    } catch {
      return Response.json({ connected: false });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}