import { motion } from 'framer-motion';
import { cardMotion } from '@/lib/motion';
import LargeTitle from '@/components/stage/LargeTitle';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, LogIn, ChevronRight, Crown, CloudOff, RotateCw } from 'lucide-react';
import { StatusState, btnPrimary, btnSecondary } from '@/components/glass/parts';
import { base44 } from '@/api/base44Client';
import DemoBanner from '@/components/stage/DemoBanner';
import JoinWithCodeDialog from '@/components/band/JoinWithCodeDialog';
import { useStage } from '@/components/stage/StageProvider';
import { BandSkeleton } from '@/components/stage/Skeletons';
import { PageBackdrop, ticketDate } from '@/components/glass';
import { localDateISO } from '@/lib/utils';
import { tr } from '@/i18n';

const MotionLink = motion.create(Link);
// Color del avatar de cada banda (inicial), rotando la paleta de la app.
const TINTS = ['lime-tint', 'bg-[#8e9aaf]/20 text-[#c4ccda]', 'bg-[#f47b6a]/18 text-[#f4a29a]'];
const DemoTag = () => <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/60">{tr('Demo')}</span>;

export default function Bands() {
  const { demoDismissed, demoHidden, allSets, loadSets } = useStage();
  const [bands, setBands] = useState([]);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  useEffect(() => { loadSets(); }, [loadSets]);

  const load = async () => {
    const [b, me] = await Promise.all([
      base44.entities.Band.list('-updated_date'),
      base44.auth.me().catch(() => null)
    ]);
    setBands(b);
    setUid(me?.id || null);
  };
  // Si la carga falla, se muestra un error con Reintentar (antes decía "no tenés bandas", #28).
  const reload = () => { setLoading(true); setLoadFailed(false); load().catch((e) => { console.error(e); setLoadFailed(true); }).finally(() => setLoading(false)); };
  useEffect(() => { reload(); }, []);

  const count = (m) => { try { return JSON.parse(m || '[]').length; } catch { return 0; } };
  const showDemo = !demoDismissed && !demoHidden;
  const myBands = bands.filter((b) => !b.is_demo && (b.created_by_id === uid || (b.member_ids || []).includes(uid)));
  const demoBands = bands.filter((b) => b.is_demo && b.created_by_id === uid);
  const isDemoView = !myBands.length && showDemo && demoBands.length > 0;
  const displayBands = myBands.length ? myBands : isDemoView ? demoBands : [];

  // Próximo show de una banda: el repertorio de la banda con la fecha más cercana desde hoy.
  const today = localDateISO();
  const nextShow = (band) => (allSets || [])
    .filter((s) => s.band_id === band.id && s.date && s.date >= today)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))[0];

  const avatar = (b, i, size) => (b.image_url
    ? <img src={b.image_url} className={`${size} rounded-2xl object-cover shrink-0`} alt={b.name} />
    : <span className={`${size} rounded-2xl ${TINTS[i % TINTS.length]} flex items-center justify-center font-display font-extrabold shrink-0`}>{b.name[0]}</span>);

  // La primera banda, grande y con su próximo show; el resto, como bloques chicos.
  const featured = (b) => {
    const show = nextShow(b);
    const director = b.created_by_id === uid;
    return (
      <MotionLink key={b.id} {...cardMotion(0)} to={`/modo-banda/${b.id}`} className="glass rounded-2xl p-4 flex flex-col gap-3.5 col-span-2">
        <span className="flex items-center gap-3.5">
          {avatar(b, 0, 'w-[60px] h-[60px] text-[28px]')}
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-2 min-w-0 font-display text-[22px] font-extrabold"><span className="truncate">{b.name}</span>{b.is_demo && <DemoTag />}</span>
            <span className="flex items-center gap-2 mt-1 text-[13px] text-white/70">
              <Users size={14} /> {count(b.members)} {tr('integrantes')}
              {director && <span className="lime-tint h-[22px] px-2 rounded-full text-[11px] font-bold inline-flex items-center gap-1"><Crown size={11} /> {tr('Director')}</span>}
            </span>
          </span>
        </span>
        {b.description && <span className="text-sm text-white/70 line-clamp-2">{b.description}</span>}
        <span className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white/[.07]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${show ? 'bg-[#f47b6a]' : 'bg-white/30'}`} />
          <span className="flex-1 min-w-0 text-[13px] truncate">
            {show ? <><span className="text-white/70">{tr('Próximo show ·')}{' '}{ticketDate(show.date)} · </span><span className="font-bold">{show.name}</span></> : <span className="text-white/70">{tr('Sin shows programados')}</span>}
          </span>
          <ChevronRight size={16} className="text-white/60 shrink-0" />
        </span>
      </MotionLink>
    );
  };
  const small = (b, i) => (
    <MotionLink key={b.id} {...cardMotion(i)} to={`/modo-banda/${b.id}`} className="glass rounded-2xl p-3.5 min-h-[124px] flex flex-col justify-between gap-3">
      {avatar(b, i, 'w-11 h-11 text-xl')}
      <span className="min-w-0">
        <span className="block text-sm font-bold truncate">{b.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5">{count(b.members)} {tr('integrantes')}{' '}{b.is_demo && <DemoTag />}</span>
      </span>
    </MotionLink>
  );
  const grid = (list) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {list.length > 0 && featured(list[0])}
      {list.slice(1).map((b, i) => small(b, i + 1))}
    </div>
  );

  return (
    <div className="relative">
      <PageBackdrop motif="staves" tint="lime" />
      <div className="relative max-w-5xl space-y-6">
        <div>
          <LargeTitle className="font-display text-[28px] sm:text-[32px] font-bold tracking-tight leading-none">{tr('Bandas')}</LargeTitle>
          <p className="text-white/70 text-sm mt-2">{tr('Coordiná repertorios y shows con tu banda.')}</p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <button onClick={() => setShowJoin(true)} className={`${btnSecondary} pl-3`}><LogIn size={17} /> {tr('Unirme con código')}</button>
            <Link to="/modo-banda/crear" className="home-cta h-11 pl-3 pr-4 rounded-full font-bold text-sm flex items-center gap-2"><Plus size={17} /> {tr('Crear banda')}</Link>
          </div>
        </div>

        {loading ? (
          <BandSkeleton count={2} />
        ) : loadFailed ? (
          <StatusState tone="error" icon={CloudOff} title={tr('No pudimos cargar tus bandas')} text={tr('Revisá tu conexión y volvé a intentar.')} actions={<button type="button" onClick={reload} className={btnPrimary}><RotateCw size={16} aria-hidden="true" /> {tr('Reintentar')}</button>} />
        ) : isDemoView ? (
          <>
            <DemoBanner />
            {grid(demoBands)}
          </>
        ) : displayBands.length ? (
          grid(displayBands)
        ) : (
          <StatusState icon={Users} title={tr('Todavía no tenés ninguna banda.')} text={tr('Creá una o sumate con el código que te pasó tu director.')} actions={(
            <>
              <Link to="/modo-banda/crear" className={btnPrimary}><Plus size={17} aria-hidden="true" /> {tr('Crear banda')}</Link>
              <button type="button" onClick={() => setShowJoin(true)} className={btnSecondary}><LogIn size={17} aria-hidden="true" /> {tr('Unirme con código')}</button>
            </>
          )} />
        )}
        {showJoin && <JoinWithCodeDialog onClose={() => setShowJoin(false)} />}
      </div>
    </div>
  );
}
