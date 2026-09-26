import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Library, ListMusic, Music2, ArrowRight, Cloud, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import AccountSection from '@/components/profile/AccountSection';
import PreferencesSection from '@/components/profile/PreferencesSection';
import GoogleDriveSync from '@/components/profile/GoogleDriveSync';
import BackupPanel from '@/components/profile/BackupPanel';

export default function MusicianProfile() {
  const { songs, sets } = useStage();
  const [user, setUser] = useState(null);
  const [upgrading, setUpgrading] = useState(() => new URLSearchParams(window.location.search).get('upgraded') === '1');
  useEffect(() => {
    let attempts = 0;
    const load = () => base44.auth.me().then((u) => {
      setUser(u);
      if (upgrading && u?.plan !== 'premium' && attempts < 8) { attempts++; setTimeout(load, 1500); }
      else if (u?.plan === 'premium') { setUpgrading(false); window.history.replaceState({}, '', '/perfil'); }
    }).catch(console.error);
    load();
  }, [upgrading]);
  return (
    <div className="max-w-3xl space-y-8">
      <div><div className="text-[#c9ef72] text-xs tracking-widest font-bold uppercase">Tu espacio</div><h1 className="text-3xl sm:text-4xl font-bold mt-2">Perfil</h1></div>
      {upgrading && <div className="rounded-2xl bg-[#c9ef72]/10 border border-[#c9ef72]/30 p-4 text-sm text-[#d8f4a3] flex items-center gap-3"><span className="w-5 h-5 border-2 border-[#c9ef72]/40 border-t-[#c9ef72] rounded-full animate-spin shrink-0" /> Procesando tu pago… en unos segundos tu plan se actualizará a Premium.</div>}
      <div className="rounded-3xl bg-[#242831] p-6 sm:p-8 flex items-center gap-5"><span className="w-16 h-16 rounded-2xl bg-[#c9ef72]/15 flex items-center justify-center text-[#c9ef72]"><UserRound size={30} /></span><div className="min-w-0"><h2 className="font-bold text-xl truncate">{user?.full_name || 'Músico de StageBook'}</h2><p className="text-white/45 text-sm mt-1 truncate">{user?.email || 'Tu cuenta musical'}</p></div></div>
      <div className="grid grid-cols-2 gap-4">{[[Library, songs.length, 'Partituras'], [ListMusic, sets.length, 'Repertorios']].map(([Icon, n, label]) => <div key={label} className="bg-[#242831] p-6 rounded-2xl"><Icon className="text-[#c9ef72] mb-3" size={22} /><div className="text-3xl font-bold">{n}</div><div className="text-sm text-white/45">{label}</div></div>)}</div>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3">Cuenta</h2><AccountSection user={user} /></section>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><Cloud size={14} /> Sincronización</h2><div className="bg-[#242831] rounded-2xl divide-y divide-white/10"><div className="p-5"><GoogleDriveSync /></div><div className="p-5"><div className="text-sm font-semibold mb-3">Copia de seguridad local</div><BackupPanel /></div></div></section>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><Settings size={14} /> Preferencias</h2><PreferencesSection /></section>
      <Link to="/bienvenida" className="flex justify-between items-center p-5 text-sm bg-[#242831] rounded-2xl"><span className="flex items-center gap-3"><Music2 size={18} /> Ver bienvenida</span><ArrowRight size={17} className="text-white/45" /></Link>
      <p className="text-xs text-white/35">Tus canciones y repertorios se guardan en tu espacio de StageBook.</p>
    </div>
  );
}