import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Check, Music2, LogIn, ArrowRight, ListMusic, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { GOOGLE_PLAY_URL } from '@/lib/config';
import { INSTRUMENTS } from '@/components/band/instruments';
import MobileSelect from '@/components/stage/MobileSelect';

export default function BandInvite() {
  const { code } = useParams();
  const nav = useNavigate();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [pick, setPick] = useState({ instrument: 'Guitarra' });

  useEffect(() => {
    let alive = true;
    base44.functions.invoke('getBandByInvite', { invite_code: code })
      .then((res) => { if (alive) { setBand(res.data.band); setLoading(false); } })
      .catch(() => { if (alive) { setInvalid(true); setLoading(false); } });
    base44.auth.me().catch(() => null).then((u) => { if (alive) { setMe(u); setMeLoading(false); } });
    return () => { alive = false; };
  }, [code]);

  const join = async () => {
    setJoining(true);
    try {
      const res = await base44.functions.invoke('joinBand', { invite_code: code, instrument: pick.instrument });
      setJoined(true);
      const b = res.data.band;
      const bandId = b?.id || band?.band_id;
      const dest = b?.live_setlist_id ? `/modo-banda/${bandId}/show/${b.live_setlist_id}` : `/modo-banda/${bandId}`;
      setTimeout(() => nav(dest), 1200);
    } catch (e) { alert(e.response?.data?.error || e.message); setJoining(false); }
  };

  const continueWithGoogle = () => {
    sessionStorage.setItem('joinAutoPending', code);
    const returnUrl = window.location.pathname + window.location.search;
    base44.auth.loginWithProvider('google', returnUrl);
  };

  // Auto-unirse tras iniciar sesión: el flag se setea al redirigir a login.
  const autoJoinTried = useRef(false);
  useEffect(() => {
    if (autoJoinTried.current || loading || meLoading || !me || !band || band.is_member || joining || joined) return;
    if (sessionStorage.getItem('joinAutoPending') === code) {
      autoJoinTried.current = true;
      sessionStorage.removeItem('joinAutoPending');
      join();
    }
  }, [me, band, loading, meLoading, joining, joined, code]);

  if (loading) return <div className="text-white/40">Buscando banda...</div>;

  if (invalid || !band) return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <Music2 size={40} className="text-white/25 mx-auto mb-4" />
      <p className="text-white/55 font-semibold">Esta invitación ya no es válida.</p>
      <p className="text-white/35 text-sm mt-2">El código no existe o fue revocado.</p>
      <Link to="/" className="text-[#c9ef72] text-sm mt-5 inline-block">Ir al inicio →</Link>
    </div>
  );

  const SetlistPreview = () => {
    const s = band.setlist;
    if (!s) return null;
    return (
      <div className="mt-5 text-left">
        <div className="flex items-center gap-2 text-[#c9ef72] text-xs tracking-widest font-bold mb-2"><ListMusic size={14} /> REPERTORIO EN VIVO</div>
        <div className="bg-black/20 rounded-2xl p-3.5 border border-white/[.06]">
          <div className="text-sm font-semibold mb-2 truncate">{s.name}</div>
          {s.songs?.length ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
              {s.songs.map((song, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-white/30 tabular-nums w-5 text-right shrink-0">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-white/85 truncate">{song.title}</div>
                    {song.artist && <div className="text-white/40 text-xs truncate">{song.artist}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/35 text-xs">El repertorio todavía no tiene canciones.</p>
          )}
        </div>
      </div>
    );
  };

  if (band.is_member) return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <h1 className="text-2xl font-bold mt-5">{band.name}</h1>
        <div className="bg-[#c9ef72]/15 text-[#c9ef72] rounded-2xl p-5 mt-5 flex flex-col items-center gap-2"><Check size={28} /><p className="font-bold">Ya sos integrante de esta banda</p></div>
        <SetlistPreview />
      </div>
      <Link to={`/modo-banda/${band.band_id}`} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full flex items-center justify-center gap-2">Entrar a la banda <ArrowRight size={18} /></Link>
    </div>
  );

  if (meLoading) return <div className="text-white/40">Cargando...</div>;

  if (!me) return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold mt-5">TE INVITARON A UNIRTE A UNA BANDA</div>
        <h1 className="text-2xl font-bold mt-3">{band.name}</h1>
        <p className="text-white/45 text-sm mt-3">Iniciá sesión para sumarte y empezar a coordinar con la banda.</p>
        <SetlistPreview />
      </div>
      <button onClick={continueWithGoogle} className="h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold w-full flex items-center justify-center gap-2"><LogIn size={18} /> Continuar con Google</button>
      <button onClick={() => { sessionStorage.setItem('joinAutoPending', code); nav('/login?returnTo=' + encodeURIComponent(window.location.pathname)); }} className="text-center text-white/40 text-sm block w-full">Ya tengo cuenta →</button>
      <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="h-12 rounded-xl border border-white/15 text-white/70 font-semibold w-full flex items-center justify-center gap-2 text-sm"><Download size={18} /> Descargar en Google Play</a>
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-[#242831] rounded-3xl p-7 text-center border border-white/[.06]">
        <div className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-3xl font-bold mx-auto">{band.name[0]}</div>
        <div className="text-[#c9ef72] text-xs tracking-widest font-bold mt-5">TE INVITARON A UNIRTE A</div>
        <h1 className="text-2xl font-bold mt-3">{band.name}</h1>
        <SetlistPreview />
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