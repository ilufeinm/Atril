import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, CalendarDays, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DemoBanner from '@/components/stage/DemoBanner';
import { useStage } from '@/components/stage/StageProvider';

export default function Bands() {
  const { demoDismissed } = useStage();
  const [bands, setBands] = useState([]);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const showDemo = !demoDismissed;
  const myBands = bands.filter((b) => !b.is_demo && b.created_by_id === uid);
  const demoBands = bands.filter((b) => b.is_demo);
  const isDemoView = !myBands.length && showDemo && demoBands.length > 0;
  const displayBands = myBands.length ? myBands : isDemoView ? demoBands : [];

  const card = (b) => (
    <Link key={b.id} to={`/modo-banda/${b.id}`} className="bg-[#242831] rounded-2xl p-5 hover:bg-[#2a2f3a] transition-colors border border-white/[.06]">
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
    </Link>
  );

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[#c9ef72] text-xs tracking-widest font-bold">TOQUEN EN SINTONÍA</div>
          <h1 className="text-3xl font-bold mt-2">Mis bandas</h1>
          <p className="text-white/45 mt-2">Coordiná repertorios y shows con tu banda.</p>
        </div>
        <Link to="/modo-banda/crear" className="h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center gap-2 shrink-0"><Plus size={18} /> Crear banda</Link>
      </div>

      {loading ? (
        <div className="text-white/40">Cargando...</div>
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
          <Link to="/modo-banda/crear" className="inline-flex mt-5 h-11 px-5 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm items-center gap-2"><Plus size={18} /> Crear banda</Link>
        </div>
      )}
    </div>
  );
}