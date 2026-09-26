import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { INSTRUMENTS, getInstrument } from '@/components/band/instruments';

export default function BandCreate() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');
  const [members, setMembers] = useState([{ name: '', instrument: 'Guitarra', role: 'member' }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  const submit = async () => {
    if (!name.trim()) { setErr('Elegí un nombre para la banda'); return; }
    setBusy(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const clean = members.filter((m) => m.name.trim()).map((m) => ({ ...m, color: getInstrument(m.instrument).color }));
      if (me) {
        const existing = clean.find((m) => m.user_id === me.id || m.name === me.full_name);
        if (existing) { existing.user_id = me.id; existing.role = 'director'; existing.name = me.full_name || existing.name; }
        else clean.unshift({ user_id: me.id, name: me.full_name || 'Tú', instrument: 'Guitarra', role: 'director', color: getInstrument('Guitarra').color });
      }
      if (!clean.some((m) => m.role === 'director') && clean[0]) clean[0].role = 'director';
      const member_ids = clean.map((m) => m.user_id).filter(Boolean);
      const editor_ids = clean.filter((m) => m.role === 'director' || m.role === 'editor').map((m) => m.user_id).filter(Boolean);
      const band = await base44.entities.Band.create({ name: name.trim(), description: desc.trim(), image_url: img.trim(), invite_code: code(), members: JSON.stringify(clean), member_ids, editor_ids });
      nav(`/modo-banda/${band.id}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-7">
      <Link to="/modo-banda" className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> Mis bandas</Link>
      <div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold">NUEVA BANDA</div>
        <h1 className="text-3xl font-bold mt-2">Crear banda</h1>
      </div>
      <div className="space-y-5">
        <div>
          <label className="text-sm text-white/60 mb-2 block">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Los Nocturnos" className="stage-input" />
        </div>
        <div>
          <label className="text-sm text-white/60 mb-2 block">Imagen (URL)</label>
          <input value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://..." className="stage-input" />
        </div>
        <div>
          <label className="text-sm text-white/60 mb-2 block">Descripción</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Estilo, género, contexto..." className="stage-input min-h-[88px] py-3" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-white/60">Integrantes</label>
            <button onClick={() => setMembers([...members, { name: '', instrument: 'Guitarra', role: 'member' }])} className="text-[#c9ef72] text-sm flex items-center gap-1 font-semibold"><Plus size={16} /> Agregar</button>
          </div>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={m.name} onChange={(e) => { const n = [...members]; n[i] = { ...m, name: e.target.value }; setMembers(n); }} placeholder="Nombre" className="stage-input flex-1" />
                <select value={m.instrument} onChange={(e) => { const n = [...members]; n[i] = { ...m, instrument: e.target.value }; setMembers(n); }} className="stage-input w-32">{INSTRUMENTS.map((x) => <option key={x.value} value={x.value}>{x.emoji} {x.value}</option>)}</select>
                <select value={m.role} onChange={(e) => { const n = [...members]; n[i] = { ...m, role: e.target.value }; setMembers(n); }} className="stage-input w-32"><option value="member">Integrante</option><option value="editor">Editor</option></select>
                {members.length > 1 && <button onClick={() => setMembers(members.filter((_, x) => x !== i))} className="p-2 text-white/35 hover:text-red-300"><X size={18} /></button>}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/35 mt-3">Al crear la banda se generará un código de invitación para sumar músicos.</p>
        </div>
      </div>
      {err && <p className="text-red-300 text-sm">{err}</p>}
      <button onClick={submit} disabled={busy} className="h-12 px-6 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center gap-2">{busy ? 'Creando...' : 'Crear banda'}</button>
    </div>
  );
}