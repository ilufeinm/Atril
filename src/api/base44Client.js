// Capa de compatibilidad: expone la misma interfaz que usaba el SDK de Base44
// (base44.entities.*, base44.auth.*, base44.integrations.Core.*, base44.functions.invoke)
// pero por debajo usa Supabase. Así el resto de la app casi no cambia.
import { supabase } from './supabaseClient';

const TABLES = {
  Song: 'songs',
  Setlist: 'setlists',
  Band: 'bands',
  BandSong: 'band_songs',
  Recording: 'recordings',
  BandMessage: 'band_messages',
  User: 'profiles',
};

// Columnas que la app puede escribir (el resto se descarta en silencio).
const WRITABLE = {
  songs: ['title', 'artist', 'composer', 'key', 'bpm', 'meter', 'type', 'folder', 'tags', 'favorite', 'file_url', 'page_urls', 'page_order', 'thumb_url', 'content', 'intro', 'structure', 'notes', 'duration', 'pages', 'annotations', 'last_page', 'font_scale', 'is_demo'],
  setlists: ['name', 'description', 'venue', 'date', 'time', 'band_id', 'song_ids', 'is_demo'],
  bands: ['name', 'description', 'image_url', 'invite_code', 'members', 'allow_editor_delete', 'live_setlist_id', 'live_index', 'chat', 'is_demo'],
  band_songs: ['band_id', 'title', 'artist', 'file_url', 'content', 'type', 'key', 'bpm', 'duration', 'pages', 'is_demo'],
  recordings: ['name', 'type', 'date', 'duration', 'setlist_id', 'setlist_name', 'audio_url', 'songs', 'notes', 'favorite'],
  band_messages: ['band_id', 'text'],
  profiles: ['full_name', 'photo_url', 'demo_dismissed', 'demo_hidden', 'demo_seeded', 'demo_sets_seeded', 'demo_bands_seeded', 'demo_linked', 'onboarding_done', 'settings'],
};
const NUMERIC = new Set(['bpm', 'duration', 'pages', 'last_page', 'font_scale', 'live_index']);
const ARRAYS = new Set(['page_urls', 'page_order', 'song_ids']);
const JSON_TEXT = new Set(['annotations', 'notes', 'songs', 'members', 'chat', 'settings']);

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  e.response = { status, data: { error: message } };
  return e;
}

function fail(error) {
  if (!error) return;
  let msg = error.message || 'Error';
  let status = 500;
  if (error.code === '42501' || /row-level security/i.test(msg)) { msg = 'No tenés permiso para hacer esto.'; status = 403; }
  else if (error.code === '28000') status = 401;
  else if (error.code === 'P0002') status = 404;
  else if (error.code === '22023') status = 400;
  throw httpError(status, msg);
}

function clean(table, obj) {
  const allowed = WRITABLE[table] || [];
  const out = {};
  for (const k of allowed) {
    if (!(k in (obj || {}))) continue;
    let v = obj[k];
    if (NUMERIC.has(k) && (v === '' || v === undefined)) continue;
    if (ARRAYS.has(k) && !Array.isArray(v)) v = [];
    if (JSON_TEXT.has(k) && v !== null && typeof v === 'object') v = JSON.stringify(v);
    out[k] = v;
  }
  return out;
}

function applySort(q, sort) {
  if (!sort || typeof sort !== 'string') return q;
  const desc = sort.startsWith('-');
  return q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
}

function applyFilters(q, query) {
  for (const [k, v] of Object.entries(query || {})) {
    if (v && typeof v === 'object' && Array.isArray(v.$in)) q = q.in(k, v.$in);
    else if (v === null) q = q.is(k, null);
    else q = q.eq(k, v);
  }
  return q;
}

function entity(name) {
  const table = TABLES[name];
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select('*');
      q = applySort(q, sort).limit(limit || 1000);
      const { data, error } = await q;
      fail(error);
      return data || [];
    },
    async filter(query = {}, opts, limit) {
      const o = typeof opts === 'string' ? { sort: opts, limit } : (opts || {});
      let q = supabase.from(table).select(Array.isArray(o.fields) && o.fields.length ? o.fields.join(',') : '*');
      q = applyFilters(q, query);
      q = applySort(q, o.sort);
      const lim = o.limit || limit || 1000;
      q = o.skip ? q.range(o.skip, o.skip + lim - 1) : q.limit(lim);
      const { data, error } = await q;
      fail(error);
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      fail(error);
      if (!data) throw httpError(404, 'No encontrado');
      return data;
    },
    async create(obj) {
      const { data, error } = await supabase.from(table).insert(clean(table, obj)).select().single();
      fail(error);
      return data;
    },
    async bulkCreate(arr) {
      if (!arr?.length) return [];
      const { data, error } = await supabase.from(table).insert(arr.map((o) => clean(table, o))).select();
      fail(error);
      return data || [];
    },
    async update(id, patch) {
      const { data, error } = await supabase.from(table).update(clean(table, patch)).eq('id', id).select().maybeSingle();
      fail(error);
      if (!data) throw httpError(403, 'No encontrado o sin permiso.');
      return data;
    },
    async bulkUpdate(items) {
      return Promise.all((items || []).map(({ id, ...patch }) => this.update(id, patch)));
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      fail(error);
      return { ok: true };
    },
    async deleteMany(query) {
      const { error } = await applyFilters(supabase.from(table).delete(), query);
      fail(error);
      return { ok: true };
    },
    // Tiempo real. Devuelve la función para cancelar la suscripción.
    subscribe(cb) {
      const ch = supabase
        .channel(`${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (p) => {
          const type = p.eventType === 'INSERT' ? 'create' : p.eventType === 'UPDATE' ? 'update' : 'delete';
          const row = type === 'delete' ? p.old : p.new;
          cb({ type, id: row?.id, data: row });
        })
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    },
  };
}

const entities = Object.fromEntries(Object.keys(TABLES).map((n) => [n, entity(n)]));

// ---------- Auth ----------
function esError(e) {
  const m = e?.message || '';
  if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos';
  if (/email not confirmed/i.test(m)) return 'Confirmá tu correo antes de ingresar.';
  if (/token has expired|invalid.*(token|otp)|otp.*(expired|invalid)/i.test(m)) return 'El código no es válido o venció.';
  if (/password should be at least/i.test(m)) return 'La contraseña es demasiado corta (mínimo 6 caracteres).';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Esperá un momento y probá de nuevo.';
  if (/different from the old password/i.test(m)) return 'La nueva contraseña debe ser distinta a la anterior.';
  return m || 'Ocurrió un error';
}
function authFail(error) {
  if (!error) return;
  throw httpError(error.status || 400, esError(error));
}

function mergeUser(authUser, profile) {
  return {
    ...(profile || {}),
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
  };
}

const auth = {
  async me() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw httpError(401, 'No autenticado');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    return mergeUser(session.user, profile);
  },
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
  async updateMe(patch) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw httpError(401, 'No autenticado');
    const { data, error } = await supabase.from('profiles').update(clean('profiles', patch)).eq('id', session.user.id).select().maybeSingle();
    fail(error);
    return mergeUser(session.user, data);
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    authFail(error);
    return { access_token: data.session?.access_token };
  },
  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    authFail(error);
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw httpError(400, 'Ya existe una cuenta con ese correo. Probá iniciar sesión.');
    }
    return { ok: true };
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
    authFail(error);
    return { access_token: data.session?.access_token };
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    authFail(error);
  },
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    authFail(error);
  },
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    authFail(error);
  },
  async loginWithProvider(provider, returnTo = '/') {
    const target = new URL(returnTo || '/', window.location.origin);
    const redirectTo = target.origin === window.location.origin ? target.toString() : window.location.origin + '/';
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    authFail(error);
  },
  redirectToLogin(url) {
    let back = '/';
    try {
      const u = new URL(url || '/', window.location.origin);
      if (u.origin === window.location.origin) back = u.pathname + u.search;
    } catch { /* usa "/" */ }
    window.location.href = '/login?returnTo=' + encodeURIComponent(back);
  },
  setToken() { /* Supabase maneja la sesión solo */ },
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

// ---------- Archivos ----------
const safeName = (n) => (n || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
async function upload(bucket, file) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw httpError(401, 'No autenticado');
  const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw httpError(500, error.message);
  return path;
}

const integrations = {
  Core: {
    async UploadPublicFile({ file }) {
      const path = await upload('public-files', file);
      return { file_url: supabase.storage.from('public-files').getPublicUrl(path).data.publicUrl };
    },
    async UploadPrivateFile({ file }) {
      return { file_uri: await upload('private-files', file) };
    },
    async CreateFileSignedUrl({ file_uri, expires_in = 3600 }) {
      const { data, error } = await supabase.storage.from('private-files').createSignedUrl(file_uri, expires_in);
      if (error) throw httpError(404, error.message);
      return { signed_url: data.signedUrl };
    },
  },
};

// ---------- Funciones (antes backend de Base44) ----------
async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  fail(error);
  return { data };
}

// Las Edge Functions devuelven el motivo del error en el cuerpo de la respuesta.
async function fnErrorMessage(error, fallback) {
  try {
    const body = await error.context.json();
    if (body?.error) return body.error;
  } catch { /* sin cuerpo */ }
  return fallback;
}

const handlers = {
  getBandByInvite: ({ invite_code }) => rpc('get_band_by_invite', { p_code: invite_code }),
  joinBand: ({ invite_code, instrument }) => rpc('join_band', { p_code: invite_code, p_instrument: instrument || null }),
  manageBandMember: ({ band_id, user_id, action }) => rpc('manage_band_member', { p_band_id: band_id, p_action: action, p_user_id: user_id || null }),
  deleteAccount: () => rpc('delete_my_data', {}),
  googleDriveStatus: async () => ({ data: { connected: false } }),

  async saveBandSong({ band_id, song_id, title, artist, file_url, content, type, key, bpm, duration, pages, setlist_id }) {
    if (!band_id) throw httpError(400, 'Falta la banda');
    const c = {
      title: (title || '').trim(), artist: (artist || '').trim(), file_url: file_url || '',
      content: content || '', type: type || 'Partitura', key: key || '',
      bpm: Number(bpm) || 0, duration: Number(duration) || 0, pages: Number(pages) || 1,
    };
    if (!c.title) throw httpError(400, 'El título es obligatorio');
    if (song_id) {
      const song = await entities.BandSong.update(song_id, c);
      return { data: { song } };
    }
    const song = await entities.BandSong.create({ band_id, ...c });
    if (setlist_id) {
      const { data: set } = await supabase.from('setlists').select('song_ids,band_id').eq('id', setlist_id).maybeSingle();
      if (set && set.band_id === band_id) await entities.Setlist.update(setlist_id, { song_ids: [...(set.song_ids || []), song.id] });
    }
    return { data: { song } };
  },

  async removeBandSong({ band_id, song_id }) {
    if (!band_id || !song_id) throw httpError(400, 'Faltan datos');
    const { data, error } = await supabase.from('band_songs').delete().eq('id', song_id).eq('band_id', band_id).select('id');
    fail(error);
    if (!data?.length) throw httpError(403, 'No tenés permiso para eliminar esta partitura.');
    return { data: { ok: true } };
  },

  async createBandShow({ band_id, name, venue, date, time }) {
    if (!band_id || !name || !name.trim()) throw httpError(400, 'Nombre y banda son obligatorios');
    const set = await entities.Setlist.create({ name: name.trim(), venue: (venue || '').trim(), date: date || '', time: time || '', band_id, song_ids: [] });
    return { data: { set } };
  },

  async createCheckout(payload) {
    const { data, error } = await supabase.functions.invoke('create-checkout', { body: payload });
    if (error) throw httpError(500, await fnErrorMessage(error, 'No se pudo iniciar el pago.'));
    return { data };
  },
};

const functions = {
  async invoke(name, payload = {}) {
    const h = handlers[name];
    if (h) return h(payload);
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    if (error) throw httpError(500, await fnErrorMessage(error, 'Error en el servidor.'));
    return { data };
  },
};

export const base44 = {
  entities,
  auth,
  integrations,
  functions,
  app: { getPublicSettings: async () => ({}) },
};
