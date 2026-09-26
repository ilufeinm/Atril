import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, X, Copy, Radio, CalendarDays, Music2, MessageSquare, Shield, Star, Trash2, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MemberAvatar from '@/components/band/MemberAvatar';
import SharedSetlist from '@/components/band/SharedSetlist';
import BandChat from '@/components/band/BandChat';
import BandScoreDialog from '@/components/band/BandScoreDialog';
import { INSTRUMENTS, getInstrument } from '@/components/band/instruments';
import { parseMembers, isDirector, isEditor, ROLE_LABEL } from '@/components/band/bandUtils';

export default function BandDetail() {
  const { id } = useParams();
  const [band, setBand] = useState(null);
  const [sets, setSets] = useState([]);
  const [songs, setSongs] = useState([]);
  const [bandSongs, setBandSongs] = useState([]);
  const [tab, setTab] = useState('repertorio');
  const [copied, setCopied] = useState(false);
  const [me, setMe] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showData, setShowData] = useState({ name: '', venue: '', date: '', time: '' });
  const [scoreDialog, setScoreDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [b, s, sg, bs, u] = await Promise.all([
      base44.entities.Band.get(id),
      base44.entities.Setlist.list('-updated_date'),
      base44.entities.Song.list('-updated_date'),
      base44.entities.BandSong.filter({ band_id: id }),
      base44.auth.me().catch(() => null)
    ]);
    setBand(b); setSets(s.filter((x) => x.band_id === id)); setSongs(sg); setBandSongs(bs); setMe(u);
    if (!activeSetId && b.live_setlist_id) setActiveSetId(b.live_setlist_id);
  };

  useEffect(() => {
    load().catch(console.error);
    const u1 = base44.entities.Band.subscribe((e) => { if (e.type === 'update' && e.data?.id === id) setBand(e.data); });
    const u2 = base44.entities.Setlist.subscribe((e) => { if ((e.type === 'update' || e.type === 'create') && e.data?.band_id === id) load(); });
    const u3 = base44.entities.BandSong.subscribe((e) => { if (e.data?.band_id === id) load(); });
    return () => { u1(); u2(); u3(); };
  }, [id]);

  if (!band) return <div className="text-white/40">Cargando banda...</div>;

  const members = parseMembers(band.members);
  const director = isDirector(band, me?.id);
  const editor = isEditor(band, members, me?.id);
  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
  const listForSet = [...bandSongs, ...songs.filter((s) => s.is_demo)];

  const copyInvite = async () => { await navigator.clipboard.writeText(`${window.location.origin}/modo-banda/invitar/${band.invite_code}`); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const createShow = async () => {
    if (!showData.name.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('createBandShow', { band_id: id, name: showData.name.trim(), venue: showData.venue.trim(), date: showData.date, time: showData.time });
      setActiveSetId(res.data.set.id); setShowForm(false); setShowData({ name: '', venue: '', date: '', time: '' }); await load();
    } catch (e) { alert(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };
  const goLive = async () => { if (activeSet) { await base44.entities.Band.update(id, { live_setlist_id: activeSet.id, live_index: 0 }); window.location.href = `/modo-banda/${id}/en-vivo`; } };
  const manageMember = async (userId, action) => { try { await base44.functions.invoke('manageBandMember', { band_id: id, user_id: userId, action }); } catch (e) { alert(e.response?.data?.error || e.message); } };
  const toggleDelete = async () => { try { await base44.functions.invoke('manageBandMember', { band_id: id, action: 'toggle_delete' }); await load(); } catch (e) { alert(e.response?.data?.error || e.message); } };
  const removeSong = async (song) => { if (!confirm(`¿Eliminar "${song.title}" del repertorio de la banda?`)) return; try { await base44.functions.invoke('removeBandSong', { band_id: id, song_id: song.id }); } catch (e) { alert(e.response?.data?.error || e.message); } };

  const tabs = [['repertorio', 'Repertorio', Music2], ['integrantes', 'Integrantes', Users], ['shows', 'Shows', CalendarDays], ['chat', 'Chat', MessageSquare]];
  const roleBadge = (role) => {
    const cls = role === 'director' ? 'bg-[#c9ef72]/20 text-[#c9ef72]' : role === 'editor' ? 'bg-[#FF8A00]/20 text-[#FF8A00]' : 'bg-white/10 text-white/60';
    const icon = role === 'director' ? <Crown size={11} /> : role === 'editor' ? <Star size={11} /> : null;
    return <span className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 ${cls}`}>{icon}{ROLE_LABEL[role] || 'Integrante'}</span>;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/modo-banda" className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> Mis bandas</Link>

      <div className="bg-[#242831] rounded-3xl p-6 border border-white/[.06]">
        <div className="flex items-center gap-4">
          {band.image_url ? <img src={band.image_url} className="w-16 h-16 rounded-2xl object-cover" alt={band.name} /> : <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-2xl font-bold">{band.name[0]}</div>}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{band.name}</h1>
            <p className="text-sm text-white/45 flex items-center gap-1.5"><Users size={14} /> {members.length} integrantes</p>
          </div>
          {director && <span className="text-xs px-3 py-1 rounded-full bg-[#c9ef72]/20 text-[#c9ef72] inline-flex items-center gap-1"><Crown size={12} /> Director</span>}
        </div>
        {band.description && <p className="text-sm text-white/50 mt-4">{band.description}</p>}
        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={goLive} className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center gap-2"><Radio size={17} /> Iniciar en vivo</button>
          <button onClick={copyInvite} className="h-11 px-4 rounded-xl bg-white/10 text-white text-sm flex items-center gap-2"><Copy size={16} /> {copied ? '¡Enlace copiado!' : 'Invitar músicos'}</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 h-12 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === k ? 'border-[#c9ef72] text-white font-semibold' : 'border-transparent text-white/45 hover:text-white'}`}><Icon size={16} /> {l}</button>
        ))}
      </div>

      {tab === 'repertorio' && (
        <div className="space-y-4">
          {sets.length > 1 && <select value={activeSetId || ''} onChange={(e) => setActiveSetId(e.target.value)} className="stage-input">{sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          {activeSet ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-bold">{activeSet.name}</h3><p className="text-sm text-white/40">{activeSet.venue || 'Lugar por definir'} · {activeSet.date || 'Sin fecha'}</p></div>
                <div className="flex items-center gap-3">
                  {editor && <button onClick={() => setScoreDialog({ song: null, setlistId: activeSet.id })} className="h-9 px-3 rounded-full bg-[#c9ef72] text-[#172013] text-sm font-bold flex items-center gap-1.5"><Plus size={16} /> Canción</button>}
                  <Link to={`/modo-banda/${id}/show/${activeSet.id}`} className="text-[#c9ef72] text-sm">Ver show →</Link>
                </div>
              </div>
              <SharedSetlist setlist={activeSet} songs={listForSet} canEdit={editor} onManageScore={(song) => setScoreDialog({ song, setlistId: activeSet.id })} onRemoveSong={removeSong} />
              {editor && <p className="text-xs text-white/35">Tus cambios se sincronizan con todos los integrantes al instante.</p>}
            </>
          ) : (
            <div className="border border-dashed border-white/15 rounded-2xl p-10 text-center">
              <p className="text-white/55">Esta banda no tiene repertorios.</p>
              {editor && <button onClick={() => setTab('shows')} className="mt-4 text-[#c9ef72] text-sm font-semibold">Crear un show →</button>}
            </div>
          )}
        </div>
      )}

      {tab === 'integrantes' && (
        <div className="space-y-4">
          {director && (
            <div className="bg-[#242831] rounded-2xl p-5 border border-white/[.06]">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><Shield size={16} className="text-[#c9ef72]" /> Gestión de banda</h3>
              <label className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-white/70">Permitir que editores eliminen partituras</span>
                <input type="checkbox" checked={!!band.allow_editor_delete} onChange={toggleDelete} className="w-5 h-5 accent-[#FF2E93]" />
              </label>
              <p className="text-xs text-white/35 mt-1">Compartí el enlace de invitación para que nuevos músicos se sumen con su cuenta y accedan al repertorio compartido.</p>
            </div>
          )}
          <div className="space-y-3">
            {members.map((m, i) => {
              const role = m.user_id === band.created_by_id ? 'director' : m.role;
              return (
                <div key={i} className="bg-[#242831] rounded-xl p-4 flex items-center gap-4">
                  <MemberAvatar member={m} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.name}{m.user_id === me?.id && <span className="text-white/40 text-xs ml-1">(tú)</span>}</div>
                    <div className="text-sm text-white/45">{getInstrument(m.instrument).emoji} {m.instrument}</div>
                  </div>
                  {roleBadge(role)}
                  {director && role !== 'director' && (
                    <div className="flex items-center gap-1 ml-2">
                      {role === 'editor'
                        ? <button onClick={() => manageMember(m.user_id, 'demote')} className="text-xs px-2.5 h-8 rounded-lg bg-white/10 text-white/70 hover:text-white">Quitar editor</button>
                        : <button onClick={() => manageMember(m.user_id, 'promote_editor')} className="text-xs px-2.5 h-8 rounded-lg bg-[#FF8A00]/15 text-[#FF8A00] hover:opacity-80">Hacer editor</button>}
                      <button onClick={() => manageMember(m.user_id, 'remove')} aria-label="Eliminar integrante" className="p-2 text-white/35 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'shows' && (
        <div className="space-y-3">
          {sets.map((s) => (
            <Link key={s.id} to={`/modo-banda/${id}/show/${s.id}`} className="bg-[#242831] rounded-xl p-4 flex items-center gap-4 hover:bg-[#2a2f3a]">
              <div className="w-12 h-12 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center"><CalendarDays size={20} /></div>
              <div className="flex-1"><div className="font-semibold">{s.name}</div><div className="text-sm text-white/45">{s.venue || 'Lugar por definir'} · {s.date || 'Sin fecha'} {s.time ? `· ${s.time}` : ''}</div></div>
              <div className="text-sm text-white/40">{(s.song_ids || []).length} canciones</div>
            </Link>
          ))}
          {editor && (showForm ? (
            <div className="bg-[#292d36] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between"><strong className="text-sm">Nuevo show</strong><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <input value={showData.name} onChange={(e) => setShowData({ ...showData, name: e.target.value })} placeholder="Nombre del show" className="stage-input" />
              <input value={showData.venue} onChange={(e) => setShowData({ ...showData, venue: e.target.value })} placeholder="Lugar" className="stage-input" />
              <div className="flex gap-2">
                <input type="date" value={showData.date} onChange={(e) => setShowData({ ...showData, date: e.target.value })} className="stage-input flex-1" />
                <input type="time" value={showData.time} onChange={(e) => setShowData({ ...showData, time: e.target.value })} className="stage-input flex-1" />
              </div>
              <button onClick={createShow} disabled={busy} className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm w-full">{busy ? 'Creando…' : 'Crear show'}</button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full h-12 rounded-xl border border-dashed border-white/20 text-white/55 text-sm flex items-center justify-center gap-2"><Plus size={18} /> Nuevo show</button>
          ))}
        </div>
      )}

      {tab === 'chat' && <BandChat band={band} me={me ? { name: me.full_name, color: '#c9ef72' } : null} />}

      {scoreDialog && <BandScoreDialog bandId={id} setlistId={scoreDialog.setlistId} song={scoreDialog.song} onClose={() => setScoreDialog(null)} onSaved={() => load()} />}
    </div>
  );
}