import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Check, Music2, LogIn, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { INSTRUMENTS } from '@/components/band/instruments';
import MobileSelect from '@/components/stage/MobileSelect';

export default function BandInvite() {
  const { code } = useParams();
  const nav = useNavigate();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [pick, setPick] = useState({ instrument: 'Guitarra' });

  useEffect(() => {
    let alive = true;
    base44.functions.invoke('getBandByInvite', { invite_code: code })
      .then((res) => { if (alive) { setBand(res.data.band); setLoading(false); } })
      .catch(() => { if (alive) { setInvalid(true); setLoading(false); } });
    base44.auth.me().catch(() => null).then((u) => { if (alive) setMe(u); });
    return () => { alive = false; };
  }, [code]);

  const join = async () => {
    setJoining(true);
    try {
      const res = await base44.functions.invoke('joinBand', { invite_code: code, instrument: pick.instrument });
      setJoined(true);
      const bandId = res.data.band?.id || band?.band_id;
      setTimeout(() => nav(`/modo-banda/${bandId}`), 1200);
    } catch (e) { alert(e.response?.data?.error || e.message); setJoining(false); }
  };

  const continueWithGoogle = () => {
    const returnUrl = window.location.pathname + window.location.search;
    base44.auth.loginWithProvider('google', returnUrl);
  };

  if (loading) return <div className="text-white/40">Buscando banda...</div>;

  if (invalid || !band) return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <Music2 size={40} className="text-white/25 mx-auto mb-4" />
      <p className="text-white/55 font-semibold">Esta invitación ya no es válida.</p>
      <p className="text-white/35 text-sm mt-2">El código no existe o fue revocado.</p>
      <Link to="/" className="text-[#c9ef72] text-sm mt-5 inline-block">Ir al inicio →</Link>
    </div>
  );

  if (band.is_member) return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <h1 className="text-2xl font-bold mt-5">{band.name}</h1>
        <div className="bg-[#c9ef72]/15 text-[#c9ef72] rounded-2xl p-5 mt-5 flex flex-col items-center gap-2"><Check size={28} /><p className="font-bold">Ya sos integrante de esta banda</p></div>
      </div>
      <Link to={`/modo-banda/${band.band_id}`} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full flex items-center justify-center gap-2">Entrar a la banda <ArrowRight size={18} /></Link>
    </div>
  );

  if (!me) return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold mt-5">TE INVITARON A UNIRTE A UNA BANDA</div>
        <h1 className="text-2xl font-bold mt-3">{band.name}</h1>
        <p className="text-white/45 text-sm mt-3">Iniciá sesión para sumarte y empezar a coordinar con la banda.</p>
      </div>
      <button onClick={continueWithGoogle} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full flex items-center justify-center gap-2"><LogIn size={18} /> Continuar con Google</button>
      <Link to="/login" className="text-center text-white/40 text-sm block">Ya tengo cuenta →</Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold mt-5">TE INVITARON A UNIRTE A</div>
        <h1 className="text-2xl font-bold mt-3">{band.name}</h1>
      </div>
      {joined ? (
        <div className="bg-[#c9ef72]/15 text-[#c9ef72] rounded-2xl p-6 text-center flex flex-col items-center gap-2"><Check size={28} /> <p className="font-bold">¡Te uniste a {band.name}!</p></div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Tu instrumento</label>
            <MobileSelect label="Tu instrumento" value={pick.instrument} onChange={(v) => setPick({ ...pick, instrument: v })} options={INSTRUMENTS.map((x) => ({ value: x.value, label: x.value, emoji: x.emoji }))} className="w-full h-12" />
          </div>
          <button onClick={join} disabled={joining} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full">{joining ? 'Uniéndose...' : 'Unirme a la banda'}</button>
        </div>
      )}
    </div>
  );
}