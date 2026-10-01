import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music2, ArrowRight, Cloud, Settings } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';
import { useAuth } from '@/lib/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatsGrid from '@/components/profile/StatsGrid';
import UpgradeCard from '@/components/profile/UpgradeCard';
import AccountSection from '@/components/profile/AccountSection';
import PreferencesSection from '@/components/profile/PreferencesSection';
import StageSettings from '@/components/profile/StageSettings';
import GoogleDriveSync from '@/components/profile/GoogleDriveSync';
import BackupPanel from '@/components/profile/BackupPanel';

export default function MusicianProfile() {
  const { songs, sets, allBands, allRecordings, user, loadSets, loadBands, loadRecordings } = useStage();
  React.useEffect(() => { loadSets(); loadBands(); loadRecordings(); }, [loadSets, loadBands, loadRecordings]);
  const { user: authUser } = useAuth();
  const [upgrading, setUpgrading] = useState(() => new URLSearchParams(window.location.search).get('upgraded') === '1');
  // El plan se actualiza en tiempo real vía la suscripción a User en AuthContext;
  // cuando llega a Premium, limpiamos el estado de "procesando pago".
  useEffect(() => {
    if (upgrading && authUser?.plan === 'premium') { setUpgrading(false); window.history.replaceState({}, '', '/perfil'); }
  }, [upgrading, authUser?.plan]);

  const uid = user?.id;
  const myBands = allBands.filter((b) => b.created_by_id === uid || (b.member_ids || []).includes(uid)).length;
  const myRecordings = allRecordings.filter((r) => r.created_by_id === uid).length;

  return (
    <div className="max-w-3xl space-y-8">
      <div><div className="text-[#c9ef72] text-xs tracking-widest font-bold uppercase">Tu espacio</div><h1 className="text-3xl sm:text-4xl font-bold mt-2">Perfil</h1></div>
      {upgrading && <div className="rounded-2xl bg-[#c9ef72]/10 border border-[#c9ef72]/30 p-4 text-sm text-[#d8f4a3] flex items-center gap-3"><span className="w-5 h-5 border-2 border-[#c9ef72]/40 border-t-[#c9ef72] rounded-full animate-spin shrink-0" /> Procesando tu pago… en unos segundos tu plan se actualizará a Premium.</div>}
      <ProfileHeader />
      <StatsGrid songs={songs.length} sets={sets.length} bands={myBands} recordings={myRecordings} />
      <UpgradeCard />
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3">Cuenta</h2><AccountSection user={authUser} /></section>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><Cloud size={14} /> Sincronización</h2><div className="bg-[#242831] rounded-2xl divide-y divide-white/10"><div className="p-5"><GoogleDriveSync /></div><div className="p-5"><div className="text-sm font-semibold mb-3">Copia de seguridad local</div><BackupPanel /></div></div></section>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3">En el escenario</h2><StageSettings /></section>
      <section><h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><Settings size={14} /> Preferencias</h2><PreferencesSection /></section>
      <Link to="/bienvenida" className="flex justify-between items-center p-5 text-sm bg-[#242831] rounded-2xl"><span className="flex items-center gap-3"><Music2 size={18} /> Ver bienvenida</span><ArrowRight size={17} className="text-white/45" /></Link>
      <p className="text-xs text-white/35">Tus canciones y repertorios se guardan en tu espacio de ScoreBook.</p>
    </div>
  );
}