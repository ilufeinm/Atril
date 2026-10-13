import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getInstrument } from '@/components/band/instruments';

export default function BandCreate() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  const submit = async () => {
    if (!name.trim()) { setErr('Elegí un nombre para la banda'); return; }
    setBusy(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      // Solo nombre y descripción: quien crea la banda queda como director y el resto se suma con la invitación.
      const clean = me ? [{ user_id: me.id, name: me.full_name || 'Tú', instrument: 'Guitarra', role: 'director', color: getInstrument('Guitarra').color }] : [];
      const member_ids = clean.map((m) => m.user_id).filter(Boolean);
      const editor_ids = member_ids;
      const band = await base44.entities.Band.create({ name: name.trim(), description: desc.trim(), image_url: '', invite_code: code(), members: JSON.stringify(clean), member_ids, editor_ids });
      nav(`/modo-banda/${band.id}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-7">
      <Link to="/modo-banda" className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> Bandas</Link>
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
          <label className="text-sm text-white/60 mb-2 block">Descripción <span className="text-white/35">(opcional)</span></label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Estilo, género, contexto..." className="stage-input min-h-[88px] py-3" />
        </div>
        <p className="text-sm text-white/45">Después de crearla vas a tener un enlace para invitar a los músicos. Cada uno se suma con su cuenta.</p>
      </div>
      {err && <p className="text-red-300 text-sm">{err}</p>}
      <button onClick={submit} disabled={busy} className="h-12 px-6 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center gap-2">{busy ? 'Creando...' : 'Crear banda'}</button>
    </div>
  );
}
