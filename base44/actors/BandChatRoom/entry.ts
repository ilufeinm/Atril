import { Actor } from 'base44:runtime/actors';

const HISTORY_LIMIT = 80;
const MAX_TEXT = 1000;

export default class BandChatRoom extends Actor {
  messages = [];
  loaded = false;

  async handleStart() {
    const saved = await this.storage.get('recent');
    if (saved) this.messages = saved;
  }

  async isMember(bandId, userId) {
    if (!userId) return false;
    const band = await this.client.asServiceRole.entities.Band.get(bandId).catch(() => null);
    if (!band) return false;
    const memberIds = band.member_ids || [];
    return band.created_by_id === userId || memberIds.includes(userId);
  }

  async loadHistory(bandId) {
    if (this.loaded) return;
    const dbMsgs = await this.client.asServiceRole.entities.BandMessage.filter({ band_id: bandId }, '-created_date', HISTORY_LIMIT);
    this.messages = dbMsgs.reverse().map((m) => ({ id: m.id, sender_id: m.sender_id, sender_name: m.sender_name, text: m.text, created: m.created_date }));
    this.loaded = true;
    await this.storage.put('recent', this.messages);
  }

  async handleConnect(conn) {
    const userId = conn.identity?.userId;
    if (!userId) { conn.reject(4001, 'auth required'); return; }
    const bandId = this.instanceId;
    const ok = await this.isMember(bandId, userId);
    if (!ok) { conn.reject(4003, 'not a member'); return; }
    await this.loadHistory(bandId);
    conn.send({ type: 'history', messages: this.messages });
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;
    const userId = conn.identity?.userId;
    if (!userId) return;
    if (msg.type !== 'send') return;
    const text = String(msg.text || '').slice(0, MAX_TEXT).trim();
    if (!text) return;
    const bandId = this.instanceId;
    const ok = await this.isMember(bandId, userId);
    if (!ok) return;
    const band = await this.client.asServiceRole.entities.Band.get(bandId).catch(() => null);
    if (!band) return;
    let senderName = 'Integrante';
    try {
      const members = JSON.parse(band.members || '[]');
      const member = members.find((m) => m.user_id === userId);
      if (member?.name) senderName = member.name;
    } catch {}
    const record = await this.client.asServiceRole.entities.BandMessage.create({
      band_id: bandId,
      sender_id: userId,
      sender_name: senderName,
      text
    });
    const entry = { id: record.id, sender_id: userId, sender_name: senderName, text, created: record.created_date };
    this.messages.push(entry);
    if (this.messages.length > HISTORY_LIMIT * 2) this.messages = this.messages.slice(-HISTORY_LIMIT * 2);
    await this.storage.put('recent', this.messages);
    this.broadcast({ type: 'message', message: entry });
  }
}