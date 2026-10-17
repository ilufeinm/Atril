import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Plus, X, Copy, Radio, CalendarDays, Music2, MessageSquare, Shield, Star, Trash2, Crown, ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatShowDate, localDateISO } from '@/lib/utils';
import { PageBackdrop, Ticket, ticketDate, daysUntil } from '@/components/glass';
import MemberAvatar from '@/components/band/MemberAvatar';
import SharedSetlist from '@/components/band/SharedSetlist';
import BandChat from '@/components/band/BandChat';
import BandScoreDialog from '@/components/band/BandScoreDialog';
import { getInstrument } from '@/components/band/instruments';
import { parseMembers, isDirector, isEditor, ROLE_LABEL } from '@/components/band/bandUtils';
import MobileSelect from '@/components/stage/MobileSelect';
import BandSetlistAssociator from '@/components/band/BandSetlistAssociator';
import ReferralCard from '@/components/band/ReferralCard';
import { DetailSkeleton } from '@/components/stage/Skeletons';
import { PUBLIC_BASE_URL } from '@/lib/config';
import { tr } from '@/i18n';

export default function BandDetail() {
  const { id } = useParams();
  const nav = useNavigate();
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
  const [allUserSets, setAllUserSets] = useState([]);
  const [showAssoc, setShowAssoc] = useState(false);
  const [assocBusy, setAssocBusy] = useState(false);

  const load = async () => {
    const [b, s, sg, bs, u] = await Promise.all([
      base44.entities.Band.get(id),
      base44.entities.Setlist.list('-updated_date'),
      base44.entities.Song.list('-updated_date'),
      base44.entities.BandSong.filter({ band_id: id }),
      base44.auth.me().catch(() => null)
    ]);
    setBand(b); setSets(s.filter((x) => x.band_id === id)); setSongs(sg); setBandSongs(bs); setMe(u); setAllUserSets(s);
    if (!activeSetId && b.live_setlist_id) setActiveSetId(b.live_setlist_id);
  };

  useEffect(() => {
    load().catch(console.error);
    const u1 = base44.entities.Band.subscribe((e) => { if (e.type === 'update' && e.data?.id === id) setBand(e.data); });
    const u2 = base44.entities.Setlist.subscribe((e) => { if ((e.type === 'update' || e.type === 'create') && e.data?.band_id === id) load(); });
    const u3 = base44.entities.BandSong.subscribe((e) => { if (e.data?.band_id === id) load(); });
    return () => { u1(); u2(); u3(); };
  }, [id]);

  if (!band) return <DetailSkeleton />;

  const members = parseMembers(band.members);
  const director = isDirector(band, me?.id);
  const editor = isEditor(band, members, me?.id);
  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
  const listForSet = [...bandSongs, ...songs];
  const userSets = allUserSets.filter((x) => !x.is_demo && x.created_by_id === me?.id);
  const availableSets = userSets.filter((x) => !x.band_id);

  const copyInvite = async () => {
    let inviteCode = band.invite_code;
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      await base44.entities.Band.update(band.id, { invite_code: inviteCode });
      setBand({ ...band, invite_code: inviteCode });
    }
    await navigator.clipboard.writeText(`${PUBLIC_BASE_URL}/join/${inviteCode}`);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  const createShow = async () => {
    if (!showData.name.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('createBandShow', { band_id: id, name: showData.name.trim(), venue: showData.venue.trim(), date: showData.date, time: showData.time });
      setActiveSetId(res.data.set.id); setShowForm(false); setShowData({ name: '', venue: '', date: '', time: '' }); await load();
    } catch (e) { alert(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };
  const goLive = async () => { if (activeSet) { await base44.entities.Band.update(id, { live_setlist_id: activeSet.id, live_index: 0 }); nav(`/modo-banda/${id}/en-vivo`); } };
  const manageMember = async (userId, action) => { try { await base44.functions.invoke('manageBandMember', { band_id: id, user_id: userId, action }); } catch (e) { alert(e.response?.data?.error || e.message); } };
  const toggleDelete = async () => { try { await base44.functions.invoke('manageBandMember', { band_id: id, action: 'toggle_delete' }); await load(); } catch (e) { alert(e.response?.data?.error || e.message); } };
  const removeSong = async (song) => { if (!confirm(tr('¿Eliminar "{{title}}" del repertorio de la banda?', { title: song.title }))) return; try { await base44.functions.invoke('removeBandSong', { band_id: id, song_id: song.id }); } catch (e) { alert(e.response?.data?.error || e.message); } };

  // Asocia repertorios existentes del usuario a la banda (sin copiar): setea band_id + permisos de miembros.
  const associateSets = async (setIds) => {
    setAssocBusy(true);
    try {
      const members = parseMembers(band.members);
      const member_ids = members.map((m) => m.user_id).filter(Boolean);
      const editor_ids = members.filter((m) => m.role === 'director' || m.role === 'editor').map((m) => m.user_id).filter(Boolean);
      await base44.entities.Setlist.bulkUpdate(setIds.map((sid) => ({ id: sid, band_id: id, member_ids, editor_ids })));
      setShowAssoc(false);
      await load();
    } catch (e) { alert(e.response?.data?.error || e.message); } finally { setAssocBusy(false); }
  };
  // Desasocia un repertorio de la banda (no lo elimina de la biblioteca del usuario).
  const unlinkSet = async (setId) => {
    if (!confirm(tr('¿Quitar este repertorio de la banda? No se eliminará tu repertorio.'))) return;
    try { await base44.entities.Setlist.update(setId, { band_id: '', member_ids: [], editor_ids: [] }); setActiveSetId(null); await load(); } catch (e) { alert(e.response?.data?.error || e.message); }
  };

  const tabs = [['repertorio', tr('Repertorio'), Music2], ['integrantes', tr('Integrantes'), Users], ['shows', tr('Shows'), CalendarDays], ['chat', tr('Chat'), MessageSquare]];
  const roleBadge = (role) => {
    const cls = role === 'director' ? 'bg-[#c9ef72]/20 text-[#c9ef72]' : role === 'editor' ? 'bg-[#FF8A00]/20 text-[#FF8A00]' : 'bg-white/10 text-white/60';
    const icon = role === 'director' ? <Crown size={11} /> : role === 'editor' ? <Star size={11} /> : null;
    return <span className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 ${cls}`}>{icon}{ROLE_LABEL[role] || tr('Integrante')}</span>;
  };

  return (
    <div className="relative">
      <PageBackdrop motif="staves" tint="lime" />
      <div className="relative max-w-4xl space-y-5">
      <Link to="/modo-banda" className="glass self-start inline-flex h-10 pl-2.5 pr-4 rounded-full text-sm font-semibold items-center gap-1"><ChevronLeft size={18} /> {tr('Bandas')}</Link>

      <div className="glass rounded-[26px] p-5">
        <div className="flex items-center gap-4">
          {band.image_url ? <img src={band.image_url} className="w-16 h-16 rounded-2xl object-cover" alt={band.name} /> : <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center font-display text-3xl font-extrabold">{band.name[0]}</div>}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[26px] font-extrabold tracking-tight truncate">{band.name}</h1>
            {/* La etiqueta de rol va debajo del nombre para no recortarlo. */}
            <p className="text-sm text-white/70 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <span className="inline-flex items-center gap-1.5"><Users size={14} /> {tr('{{length}} integrantes', { length: members.length })}</span>
              {director && <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#c9ef72]/20 text-[#c9ef72] inline-flex items-center gap-1"><Crown size={12} /> {tr('Director')}</span>}
            </p>
          </div>
        </div>
        {band.description && <p className="text-sm text-white/70 mt-3">{band.description}</p>}
        <div className="flex flex-wrap gap-2.5 mt-5">
          <button onClick={goLive} className="live-cta flex-1 sm:flex-none justify-center h-12 px-6 rounded-full font-bold text-[15px] whitespace-nowrap flex items-center gap-2"><Radio size={17} /> {tr('Tocar en vivo')}</button>
          <button onClick={copyInvite} className="h-12 px-4 rounded-full bg-white/[.12] text-white text-sm font-semibold flex items-center gap-2"><Copy size={16} /> {copied ? tr('¡Copiado!') : <><span className="sm:hidden">{tr('Invitar')}</span><span className="hidden sm:inline">{tr('Invitar músicos')}</span></>}</button>
        </div>
      </div>

      <div className="glass no-scrollbar flex gap-0.5 p-1 rounded-full overflow-x-auto">
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 h-10 rounded-full text-[13px] whitespace-nowrap transition-colors ${tab === k ? 'home-cta seg-on font-bold' : 'text-white/70 hover:text-white font-semibold'}`}><Icon size={15} className="hidden sm:block" /> {l}</button>
        ))}
      </div>

      {tab === 'repertorio' && (
        <div className="space-y-4">
          {activeSet ? (
            <>
              {editor && <button onClick={() => setShowAssoc(true)} className="glass-flat border-dashed w-full h-11 rounded-full text-white/70 text-sm font-semibold flex items-center justify-center gap-2"><Plus size={16} /> {tr('Agregar repertorio')}</button>}
              {sets.length > 1 && <MobileSelect label={tr('Show')} value={activeSetId || ''} onChange={setActiveSetId} options={sets.map((s) => ({ value: s.id, label: s.name }))} className="w-full" />}
              {/* El show activo, como entrada: toda la parte de arriba lleva al show; "+ Canción" en el talón. */}
              <Ticket stub={(
                <>
                  <span className="flex-1 min-w-0 text-xs text-white/60 leading-snug">{tr('Los cambios llegan a todos al instante')}</span>
                  {editor && <button onClick={() => setScoreDialog({ song: null, setlistId: activeSet.id })} className="h-10 px-4 rounded-full bg-white/[.14] text-white text-sm font-bold flex items-center gap-1.5 shrink-0"><Plus size={16} /> {tr('Canción')}</button>}
                </>
              )}>
                <Link to={`/modo-banda/${id}/show/${activeSet.id}`} className="block">
                  <span className="flex items-center justify-between gap-2 text-[11px] font-extrabold tracking-[.12em] uppercase">
                    <span className="text-white/70 truncate">{ticketDate(activeSet.date, activeSet.time)}</span>
                    {daysUntil(activeSet.date, localDateISO()) && <span className="text-[#f47b6a] shrink-0">{daysUntil(activeSet.date, localDateISO())}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2 mt-2">
                    <span className="font-display text-[22px] font-extrabold leading-tight truncate">{activeSet.name}</span>
                    <ChevronRight size={18} className="text-white/60 shrink-0" />
                  </span>
                  <span className="block text-sm text-white/70 mt-1">{activeSet.venue || tr('Lugar por definir')} {tr('· {{length}} canciones', { length: (activeSet.song_ids || []).length })}</span>
                </Link>
              </Ticket>
              <SharedSetlist setlist={activeSet} songs={listForSet} canEdit={editor} onManageScore={(song) => setScoreDialog({ song, setlistId: activeSet.id })} onRemoveSong={removeSong} />
              {editor && <button onClick={() => unlinkSet(activeSet.id)} className="text-xs text-white/60 hover:text-red-400">{tr('Quitar de la banda')}</button>}
            </>
          ) : (
            <div className="glass-flat border-dashed rounded-3xl p-10 text-center">
              <span className="w-14 h-14 rounded-2xl bg-[#c9ef72]/10 text-[#c9ef72] flex items-center justify-center mx-auto mb-4"><Music2 size={26} /></span>
              <p className="text-white font-semibold">{tr('Esta banda todavía no tiene repertorios')}</p>
              <p className="text-sm text-white/60 mt-2">{tr('Agregá un repertorio existente para comenzar.')}</p>
              {editor && <button onClick={() => setShowAssoc(true)} className="home-cta mt-5 h-11 px-5 rounded-full font-bold text-sm inline-flex items-center gap-2"><Plus size={18} /> {tr('Agregar repertorio')}</button>}
            </div>
          )}
        </div>
      )}

      {tab === 'integrantes' && (
        <div className="space-y-4">
          {director && (
            <ReferralCard referralCount={me?.referral_count} onShare={copyInvite} copied={copied} />
          )}
          {director && (
            <div className="glass-flat rounded-3xl p-5">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><Shield size={16} className="text-[#c9ef72]" /> {tr('Gestión de banda')}</h3>
              <label className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-white/70">{tr('Permitir que editores eliminen partituras')}</span>
                <input type="checkbox" checked={!!band.allow_editor_delete} onChange={toggleDelete} className="w-5 h-5 accent-[#FF2E93]" />
              </label>
              <p className="text-xs text-white/60 mt-1">{tr('Compartí el enlace de invitación para que nuevos músicos se sumen con su cuenta y accedan al repertorio compartido.')}</p>
            </div>
          )}
          <div className="space-y-3">
            {members.map((m, i) => {
              const role = m.user_id === band.created_by_id ? 'director' : m.role;
              return (
                <div key={i} className="glass-flat rounded-2xl p-4 flex items-center gap-4">
                  <MemberAvatar member={m} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.name}{m.user_id === me?.id && <span className="text-white/40 text-xs ml-1">{tr('(tú)')}</span>}</div>
                    <div className="text-sm text-white/60">{getInstrument(m.instrument).emoji} {tr(m.instrument)}</div>
                  </div>
                  {roleBadge(role)}
                  {director && role !== 'director' && (
                    <div className="flex items-center gap-1 ml-2">
                      {role === 'editor'
                        ? <button onClick={() => manageMember(m.user_id, 'demote')} className="text-xs px-2.5 h-8 rounded-lg bg-white/10 text-white/70 hover:text-white">{tr('Quitar editor')}</button>
                        : <button onClick={() => manageMember(m.user_id, 'promote_editor')} className="text-xs px-2.5 h-8 rounded-lg bg-[#FF8A00]/15 text-[#FF8A00] hover:opacity-80">{tr('Hacer editor')}</button>}
                      <button onClick={() => manageMember(m.user_id, 'remove')} aria-label={tr('Eliminar integrante')} className="p-2 text-white/35 hover:text-red-400"><Trash2 size={16} /></button>
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
            <Link key={s.id} to={`/modo-banda/${id}/show/${s.id}`} className="glass-flat rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center"><CalendarDays size={20} /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate">{s.name}</div><div className="text-sm text-white/60">{s.venue || tr('Lugar por definir')} · {formatShowDate(s.date, s.time) || tr('Sin fecha')}</div></div>
              <div className="text-sm text-white/60 shrink-0">{(s.song_ids || []).length} {tr('canciones')}</div>
            </Link>
          ))}
          {editor && (showForm ? (
            <div className="glass-flat rounded-3xl p-4 space-y-3">
              <div className="flex justify-between"><strong className="text-sm">{tr('Nuevo show')}</strong><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <input value={showData.name} onChange={(e) => setShowData({ ...showData, name: e.target.value })} placeholder={tr('Nombre del show')} className="stage-input" />
              <input value={showData.venue} onChange={(e) => setShowData({ ...showData, venue: e.target.value })} placeholder={tr('Lugar')} className="stage-input" />
              <div className="flex gap-2">
                <input type="date" value={showData.date} onChange={(e) => setShowData({ ...showData, date: e.target.value })} className="stage-input flex-1" />
                <input type="time" value={showData.time} onChange={(e) => setShowData({ ...showData, time: e.target.value })} className="stage-input flex-1" />
              </div>
              <button onClick={createShow} disabled={busy} className="home-cta h-11 px-5 rounded-full font-bold text-sm w-full">{busy ? tr('Creando…') : tr('Crear show')}</button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="glass-flat border-dashed w-full h-12 rounded-full text-white/70 text-sm font-semibold flex items-center justify-center gap-2"><Plus size={18} /> {tr('Nuevo show')}</button>
          ))}
        </div>
      )}

      {tab === 'chat' && <BandChat band={band} me={me} />}

      {scoreDialog && <BandScoreDialog bandId={id} setlistId={scoreDialog.setlistId} song={scoreDialog.song} onClose={() => setScoreDialog(null)} onSaved={() => load()} />}
      {showAssoc && <BandSetlistAssociator available={availableSets} userSetCount={userSets.length} onClose={() => setShowAssoc(false)} onAssociate={associateSets} busy={assocBusy} />}
      </div>
    </div>
  );
}