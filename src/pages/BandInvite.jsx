import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Check, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { INSTRUMENTS, getInstrument } from '@/components/band/instruments';

export default function BandInvite() {
  const { code } = useParams();
  const nav = useNavigate();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [me, setMe] = useState(null);
  const [pick, setPick] = useState({ instrument: 'Guitarra', role: 'Músico' });

  useEffect(() => {
    base44.functions.invoke('getBandByInvite', { invite_code: code }).then((res) => { setBand(res.data.band); setLoading(false); }).catch(() => setLoading(false));
    base44.auth.me().catch(() => null).then(setMe);
  }, [code]);

  const members = () => { try { return JSON.parse(band?.members || '[]'); } catch { return []; } };
  const join = async () => {
    try {
      await base44.functions.invoke('joinBand', { invite_code: code, instrument: pick.instrument });
      setJoined(true);
      setTimeout(() => nav(`/modo-banda/${band.id}`), 1500);
    } catch (e) { alert(e.response?.data?.error || e.message); }
  };

  if (loading) return <div className="text-white/40">Buscando banda...</div>;
  if (!band) return (
    <div className="max-w-md mx-auto text-center py-20">
      <Music2 size={40} className="text-white/25 mx-auto mb-4" />
      <p className="text-white/55">El enlace de invitación no es válido.</p>
      <Link to="/modo-banda" className="text-[#c9ef72] text-sm mt-4 inline-block">Ver mis bandas →</Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center"><div className="text-[#c9ef72] text-xs tracking-widest font-bold">INVITACIÓN</div></div>
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        {band.image_url ? <img src={band.image_url} className="w-20 h-20 rounded-2xl object-cover mx-auto" alt={band.name} /> : <div className="w-20 h-20 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>}
        <h1 className="text-2xl font-bold mt-5">{band.name}</h1>
        <p className="text-white/50 mt-2 text-sm flex items-center justify-center gap-1.5"><Users size={14} /> {members().length} integrantes</p>
        {band.description && <p className="text-white/45 text-sm mt-4">{band.description}</p>}
      </div>
      {joined ? (
        <div className="bg-[#c9ef72]/15 text-[#c9ef72] rounded-2xl p-6 text-center flex flex-col items-center gap-2"><Check size={28} /> <p className="font-bold">¡Te uniste a {band.name}!</p></div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Tu instrumento</label>
            <select value={pick.instrument} onChange={(e) => setPick({ ...pick, instrument: e.target.value })} className="stage-input">{INSTRUMENTS.map((x) => <option key={x.value} value={x.value}>{x.emoji} {x.value}</option>)}</select>
          </div>
          <button onClick={join} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full">Unirse a la banda</button>
        </div>
      )}
    </div>
  );
}