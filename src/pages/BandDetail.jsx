import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, X, Copy, Radio, CalendarDays, Music2, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MemberAvatar from '@/components/band/MemberAvatar';
import SharedSetlist from '@/components/band/SharedSetlist';
import BandChat from '@/components/band/BandChat';
import { INSTRUMENTS, getInstrument } from '@/components/band/instruments';

export default function BandDetail() {
  const { id } = useParams();
  const [band, setBand] = useState(null);
  const [sets, setSets] = useState([]);
  const [songs, setSongs] = useState([]);
  const [tab, setTab] = useState('repertorio');
  const [copied, setCopied] = useState(false);
  const [me, setMe] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', instrument: 'Guitarra', role: 'Músico' });
  const [showForm, setShowForm] = useState(false);
  const [showData, setShowData] = useState({ name: '', venue: '', date: '', time: '' });

  const load = async () => {
    const [b, s, sg, u] = await Promise.all([base44.entities.Band.get(id), base44.entities.Setlist.list('-updated_date'), base44.entities.Song.list('-updated_date'), base44.auth.me().catch(() => null)]);
    setBand(b); setSets(s.filter((x) => x.band_id === id)); setSongs(sg); setMe(u);
    if (!activeSetId && b.live_setlist_id) setActiveSetId(b.live_setlist_id);
  };

  useEffect(() => {
    load().catch(console.error);
    const unsub = base44.entities.Band.subscribe((e) => { if (e.type === 'update' && e.data?.id === id) setBand(e.data); });
    return unsub;
  }, [id]);

  useEffect(() => {
    const unsub = base44.entities.Setlist.subscribe((e) => { if ((e.type === 'update' || e.type === 'create') && e.data?.band_id === id) load(); });
    return unsub;
  }, [id]);

  const members = () => { try { return JSON.parse(band?.members || '[]'); } catch { return []; } };
  const isDirector = me && band && me.id === band.created_by_id;
  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];

  const copyInvite = async () => { await navigator.clipboard.writeText(`${window.location.origin}/modo-banda/invitar/${band.invite_code}`); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const addMember = async () => {
    if (!newMember.name.trim()) return;
    const next = [...members(), { ...newMember, color: getInstrument(newMember.instrument).color }];
    await base44.entities.Band.update(id, { members: JSON.stringify(next) });
    setAddingMember(false); setNewMember({ name: '', instrument: 'Guitarra', role: 'Músico' });
  };
  const createShow = async () => {
    if (!showData.name.trim()) return;
    const s = await base44.entities.Setlist.create({ name: showData.name.trim(), venue: showData.venue.trim(), date: showData.date, time: showData.time, band_id: id, song_ids: [] });
    setShowForm(false); setShowData({ name: '', venue: '', date: '', time: '' }); setActiveSetId(s.id); await load();
  };
  const goLive = async () => { if (activeSet) { await base44.entities.Band.update(id, { live_setlist_id: activeSet.id, live_index: 0 }); window.location.href = `/modo-banda/${id}/en-vivo`; } };

  if (!band) return <div className="text-white/40">Cargando banda...</div>;

  const tabs = [['repertorio', 'Repertorio', Music2], ['integrantes', 'Integrantes', Users], ['shows', 'Shows', CalendarDays], ['chat', 'Chat', MessageSquare]];

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/modo-banda" className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> Mis bandas</Link>

      <div className="bg-[#242831] rounded-3xl p-6 border border-white/[.06]">
        <div className="flex items-center gap-4">
          {band.image_url ? <img src={band.image_url} className="w-16 h-16 rounded-2xl object-cover" alt={band.name} /> : <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-2xl font-bold">{band.name[0]}</div>}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{band.name}</h1>
            <p className="text-sm text-white/45 flex items-center gap-1.5"><Users size={14} /> {members().length} integrantes</p>
          </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{activeSet.name}</h3>
                  <p className="text-sm text-white/40">{activeSet.venue || 'Lugar por definir'} · {activeSet.date || 'Sin fecha'}</p>
                </div>
                <Link to={`/modo-banda/${id}/show/${activeSet.id}`} className="text-[#c9ef72] text-sm">Ver show →</Link>
              </div>
              <SharedSetlist setlist={activeSet} songs={songs} editable={isDirector} onUpdated={load} />
              {isDirector && <p className="text-xs text-white/35">Como director, podés reordenar. Los demás verán los cambios al instante.</p>}
            </>
          ) : (
            <div className="border border-dashed border-white/15 rounded-2xl p-10 text-center">
              <p className="text-white/55">Esta banda no tiene repertorios.</p>
              <button onClick={() => setTab('shows')} className="mt-4 text-[#c9ef72] text-sm font-semibold">Crear un show →</button>
            </div>
          )}
        </div>
      )}

      {tab === 'integrantes' && (
        <div className="space-y-3">
          {members().map((m, i) => (
            <div key={i} className="bg-[#242831] rounded-xl p-4 flex items-center gap-4">
              <MemberAvatar member={m} size={48} />
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-white/45">{getInstrument(m.instrument).emoji} {m.instrument}</div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${m.role === 'Director' ? 'bg-[#c9ef72]/20 text-[#c9ef72]' : 'bg-white/10 text-white/60'}`}>{m.role}</span>
            </div>
          ))}
          {isDirector && (
            <>
              {addingMember ? (
                <div className="bg-[#292d36] rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between"><strong className="text-sm">Agregar integrante</strong><button onClick={() => setAddingMember(false)}><X size={18} /></button></div>
                  <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Nombre" className="stage-input" />
                  <div className="flex gap-2">
                    <select value={newMember.instrument} onChange={(e) => setNewMember({ ...newMember, instrument: e.target.value })} className="stage-input flex-1">{INSTRUMENTS.map((x) => <option key={x.value} value={x.value}>{x.emoji} {x.value}</option>)}</select>
                    <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="stage-input w-32"><option>Músico</option><option>Director</option><option>Invitado</option></select>
                  </div>
                  <button onClick={addMember} className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm w-full">Agregar</button>
                </div>
              ) : (
                <button onClick={() => setAddingMember(true)} className="w-full h-12 rounded-xl border border-dashed border-white/20 text-white/55 text-sm flex items-center justify-center gap-2"><Plus size={18} /> Agregar integrante</button>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'shows' && (
        <div className="space-y-3">
          {sets.map((s) => (
            <Link key={s.id} to={`/modo-banda/${id}/show/${s.id}`} className="bg-[#242831] rounded-xl p-4 flex items-center gap-4 hover:bg-[#2a2f3a]">
              <div className="w-12 h-12 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center"><CalendarDays size={20} /></div>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-white/45">{s.venue || 'Lugar por definir'} · {s.date || 'Sin fecha'} {s.time ? `· ${s.time}` : ''}</div>
              </div>
              <div className="text-sm text-white/40">{(s.song_ids || []).length} canciones</div>
            </Link>
          ))}
          {showForm ? (
            <div className="bg-[#292d36] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between"><strong className="text-sm">Nuevo show</strong><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <input value={showData.name} onChange={(e) => setShowData({ ...showData, name: e.target.value })} placeholder="Nombre del show" className="stage-input" />
              <input value={showData.venue} onChange={(e) => setShowData({ ...showData, venue: e.target.value })} placeholder="Lugar" className="stage-input" />
              <div className="flex gap-2">
                <input type="date" value={showData.date} onChange={(e) => setShowData({ ...showData, date: e.target.value })} className="stage-input flex-1" />
                <input type="time" value={showData.time} onChange={(e) => setShowData({ ...showData, time: e.target.value })} className="stage-input flex-1" />
              </div>
              <button onClick={createShow} className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm w-full">Crear show</button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full h-12 rounded-xl border border-dashed border-white/20 text-white/55 text-sm flex items-center justify-center gap-2"><Plus size={18} /> Nuevo show</button>
          )}
        </div>
      )}

      {tab === 'chat' && <BandChat band={band} me={me ? { name: me.full_name, color: '#c9ef72' } : null} />}
    </div>
  );
}