import { motion } from 'framer-motion';
import { cardMotion } from '@/lib/motion';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, CalendarDays, Music2, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DemoBanner from '@/components/stage/DemoBanner';
import JoinWithCodeDialog from '@/components/band/JoinWithCodeDialog';
import { useStage } from '@/components/stage/StageProvider';
import { BandSkeleton } from '@/components/stage/Skeletons';

const MotionLink = motion.create(Link);

export default function Bands() {
  const { demoDismissed, demoHidden } = useStage();
  const [bands, setBands] = useState([]);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);

  const load = async () => {
    const [b, me] = await Promise.all([
      base44.entities.Band.list('-updated_date'),
      base44.auth.me().catch(() => null)
    ]);
    setBands(b);
    setUid(me?.id || null);
  };
  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, []);

  const count = (m) => { try { return JSON.parse(m || '[]').length; } catch { return 0; } };
  const showDemo = !demoDismissed && !demoHidden;
  const myBands = bands.filter((b) => !b.is_demo && (b.created_by_id === uid || (b.member_ids || []).includes(uid)));
  const demoBands = bands.filter((b) => b.is_demo && b.created_by_id === uid);
  const isDemoView = !myBands.length && showDemo && demoBands.length > 0;
  const displayBands = myBands.length ? myBands : isDemoView ? demoBands : [];

  const card = (b, i) => (
    <MotionLink key={b.id} {...cardMotion(i)} to={`/modo-banda/${b.id}`} className="bg-[#242831] rounded-2xl p-5 hover:bg-[#2a2f3a] hover:shadow-xl hover:shadow-black/25 transition-[background-color,box-shadow] duration-200 border border-white/[.06]">
      <div className="flex items-center gap-4">
        {b.image_url ? <img src={b.image_url} className="w-16 h-16 rounded-xl object-cover" alt={b.name} /> : <div className="w-16 h-16 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center text-2xl font-bold">{b.name[0]}</div>}
        <div className="min-w-0">
          <h3 className="font-bold text-lg truncate flex items-center gap-2">{b.name}{b.is_demo && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span>}</h3>
          <p className="text-sm text-white/45 flex items-center gap-1.5"><Users size={14} /> {count(b.members)} integrantes</p>
        </div>
      </div>
      {b.description && <p className="text-sm text-white/40 mt-4 line-clamp-2">{b.description}</p>}
      <div className="flex items-center gap-4 mt-4 text-xs text-white/35">
        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Próximo show</span>
        <span className="flex items-center gap-1.5"><Music2 size={14} /> Repertorio compartido</span>
      </div>
    </MotionLink>
  );

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[#c9ef72] text-xs tracking-widest font-bold">TOQUEN EN SINTONÍA</div>
          <h1 className="text-3xl font-bold mt-2">Mis bandas</h1>
          <p className="text-white/45 mt-2">Coordiná repertorios y shows con tu banda.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowJoin(true)} className="h-11 px-4 rounded-xl bg-white/10 text-white text-sm flex items-center gap-2"><LogIn size={18} /> <span className="hidden sm:inline">Unirme con código</span><span className="sm:hidden">Unirme</span></button>
          <Link to="/modo-banda/crear" className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center gap-2"><Plus size={18} /> Crear banda</Link>
        </div>
      </div>

      {loading ? (
        <BandSkeleton count={2} />
      ) : isDemoView ? (
        <>
          <DemoBanner />
          <div className="grid sm:grid-cols-2 gap-4">{demoBands.map(card)}</div>
        </>
      ) : displayBands.length ? (
        <div className="grid sm:grid-cols-2 gap-4">{displayBands.map(card)}</div>
      ) : (
        <div className="border border-dashed border-white/15 rounded-2xl p-12 text-center">
          <Users size={40} className="text-white/25 mx-auto mb-4" />
          <p className="text-white/55">Todavía no creaste ninguna banda.</p>
          <div className="flex gap-2 justify-center mt-5">
            <button onClick={() => setShowJoin(true)} className="h-11 px-4 rounded-xl bg-white/10 text-white text-sm flex items-center gap-2"><LogIn size={18} /> Unirme con código</button>
            <Link to="/modo-banda/crear" className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center gap-2"><Plus size={18} /> Crear banda</Link>
          </div>
        </div>
      )}
      {showJoin && <JoinWithCodeDialog onClose={() => setShowJoin(false)} />}
    </div>
  );
}