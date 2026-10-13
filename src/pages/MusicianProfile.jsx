import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Settings } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';
import { useAuth } from '@/lib/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatsGrid from '@/components/profile/StatsGrid';
import UpgradeCard from '@/components/profile/UpgradeCard';
import AccountSection from '@/components/profile/AccountSection';
import { PageBackdrop, SectionLabel } from '@/components/glass';

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
    <div className="relative">
    <PageBackdrop motif="score" height={520} />
    <div className="relative max-w-3xl space-y-5">
      <h1 className="font-display text-[34px] sm:text-4xl font-extrabold tracking-tight leading-none">Perfil</h1>
      {upgrading && <div className="rounded-2xl bg-[#c9ef72]/10 border border-[#c9ef72]/30 p-4 text-sm text-[#d8f4a3] flex items-center gap-3"><span className="w-5 h-5 border-2 border-[#c9ef72]/40 border-t-[#c9ef72] rounded-full animate-spin shrink-0" /> Procesando tu pago… en unos segundos tu plan se actualizará a Premium.</div>}
      <ProfileHeader />
      <StatsGrid songs={songs.length} sets={sets.length} bands={myBands} recordings={myRecordings} />
      <UpgradeCard />
      {/* Configuración de la app en su propia pantalla: el Perfil queda corto (lo común a la vista, lo avanzado un nivel adentro). */}
      <Link to="/perfil/configuracion" className="glass flex justify-between items-center gap-3 p-4 pl-5 rounded-3xl">
        <span className="flex items-center gap-3 min-w-0">
          <Settings size={18} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[15px] font-bold">Configuración</span>
            <span className="block text-xs text-white/70 truncate">Modo En Vivo, pedal, tema y más</span>
          </span>
        </span>
        <ChevronRight size={18} className="text-white/60 shrink-0" aria-hidden="true" />
      </Link>
      <section className="pt-1"><SectionLabel className="mb-3">Cuenta</SectionLabel><AccountSection user={authUser} /></section>
    </div>
    </div>
  );
}