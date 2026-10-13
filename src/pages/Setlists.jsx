import { motion } from 'framer-motion';
import { cardMotion } from '@/lib/motion';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Music2, X, ChevronLeft, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStage } from '@/components/stage/StageProvider';
import SetEditor from '@/components/stage/SetEditor';
import DemoBanner from '@/components/stage/DemoBanner';
import PullToRefresh from '@/components/stage/PullToRefresh';
import { SetlistSkeleton } from '@/components/stage/Skeletons';
import { Ticket, ticketDate, daysUntil, SectionLabel } from '@/components/glass';
import { localDateISO } from '@/lib/utils';

const DemoTag = () => <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/60">Demo</span>;

export default function Setlists() {
  const { sets, demoSets, allSets, allSongs, demoDismissed, demoHidden, loading, error, saveSet, refresh, setsLoaded, setsLoading, loadSets } = useStage();
  React.useEffect(() => { loadSets(); }, [loadSets]);
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', venue: '', date: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPast, setShowPast] = useState(false);
  const selected = allSets.find((s) => s.id === params.get('abrir'));
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setFormError('');
    try { const result = await saveSet({ ...form, song_ids: [] }); setParams({ abrir: result.id }); setForm({ name: '', venue: '', date: '' }); }
    catch (err) { setFormError(err.message || 'No se pudo guardar.'); }
    finally { setBusy(false); }
  };
  const showDemo = !demoDismissed && !demoHidden && demoSets.length > 0;
  const open = (id) => setParams({ abrir: id });

  // Duración estimada (3 min por canción si la partitura no tiene una cargada), igual que en el show.
  const minutesOf = (s) => Math.round((s.song_ids || []).reduce((t, id) => t + (allSongs.find((x) => x.id === id)?.duration || 180), 0) / 60);
  const meta = (s) => {
    const n = s.song_ids?.length || 0;
    return `${n} ${n === 1 ? 'canción' : 'canciones'}${n ? ` · ≈ ${minutesOf(s)} min` : ''}`;
  };

  const today = localDateISO();
  const upcoming = sets.filter((s) => s.date && s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const undated = sets.filter((s) => !s.date);
  const past = sets.filter((s) => s.date && s.date < today).sort((a, b) => b.date.localeCompare(a.date));

  // Repertorio abierto: su propia pantalla, con la entrada del show arriba (ver SetEditor).
  if (selected) {
    return (
      <PullToRefresh onRefresh={refresh}>
        <div className="max-w-3xl space-y-5">
          <button onClick={() => setParams({})} className="glass h-10 pl-2.5 pr-4 rounded-full text-sm font-semibold flex items-center gap-1"><ChevronLeft size={18} /> Repertorios</button>
          <SetEditor setlist={selected} />
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="space-y-6">
        <header className="flex justify-between gap-4 items-end">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] sm:text-4xl font-extrabold tracking-tight leading-none">Repertorios</h1>
            <p className="text-sm text-white/70 mt-2">Cada show, en el orden perfecto.</p>
          </div>
          <button onClick={() => setParams({ nuevo: '1' })} className="home-cta h-11 px-4 rounded-full font-bold text-sm flex items-center gap-2 shrink-0"><Plus size={18} /> Nuevo</button>
        </header>

        {(loading || setsLoading || !setsLoaded) ? <SetlistSkeleton count={3} /> : error ? <p role="alert">{error}</p> : (
          <>
            {sets.length === 0 && (
              <div className="glass-flat border-dashed rounded-3xl p-10 text-center">
                <Music2 size={36} className="text-white/30 mx-auto mb-4" />
                <p className="text-white font-medium">Aún no hay repertorios</p>
                <p className="text-white/60 text-sm mt-1.5">Armá el orden perfecto para tu próximo show.</p>
                <button onClick={() => setParams({ nuevo: '1' })} className="home-cta mt-5 inline-flex h-11 px-5 rounded-full font-bold text-sm items-center gap-2"><Plus size={16} /> Crear repertorio</button>
              </div>
            )}

            {upcoming.length > 0 && (
              <section className="space-y-3">
                <SectionLabel>Próximos</SectionLabel>
                <div className="grid lg:grid-cols-2 gap-3">
                  {upcoming.map((s, i) => {
                    const left = daysUntil(s.date, today);
                    return (
                      <motion.div key={s.id} {...cardMotion(i)}>
                        <Ticket stub={(
                          <>
                            <button onClick={() => open(s.id)} className="flex-1 min-w-0 flex items-center gap-0.5 text-[13px] whitespace-nowrap text-white/70 text-left">Ver repertorio <ChevronRight size={15} /></button>
                            <Link to={`/presentacion/${s.id}`} className="live-cta h-12 px-4 rounded-full font-bold text-[13px] flex items-center gap-2 shrink-0"><Play size={15} fill="currentColor" /> Tocar en vivo</Link>
                          </>
                        )}>
                          <button onClick={() => open(s.id)} className="w-full text-left">
                            <span className="flex items-center justify-between gap-2 text-[11px] font-extrabold tracking-[.12em] uppercase">
                              <span className="text-white/70 truncate">{ticketDate(s.date, s.time)}</span>
                              {left && <span className="text-[#f47b6a] shrink-0">{left}</span>}
                            </span>
                            <span className="block font-display text-[24px] font-extrabold leading-[1.1] tracking-tight mt-2 truncate">{s.name}</span>
                            <span className="block text-white/70 text-sm mt-1">{s.venue || 'Lugar por definir'} · {meta(s)}</span>
                          </button>
                        </Ticket>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {undated.length > 0 && (
              <section className="space-y-3">
                <SectionLabel>Sin fecha</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {undated.map((s, i) => (
                    <motion.button key={s.id} {...cardMotion(i)} onClick={() => open(s.id)} className="press-none glass rounded-3xl p-3.5 text-left min-h-[96px] flex flex-col justify-between gap-3">
                      <span className="text-[15px] font-bold leading-snug">{s.name}</span>
                      <span className="text-xs text-white/60">{meta(s)}</span>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="space-y-3">
                <button onClick={() => setShowPast((v) => !v)} aria-expanded={showPast} className="flex items-center gap-1.5 text-sm font-semibold text-white/70">
                  Pasados · {past.length} <ChevronDown size={16} className={`transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`} />
                </button>
                {showPast && (
                  <div className="grid lg:grid-cols-2 gap-3">
                    {/* Entradas ya usadas: apagadas y con el sello de cuándo se tocó. */}
                    {past.map((s) => (
                      <button key={s.id} onClick={() => open(s.id)} className="glass-flat border-dashed rounded-3xl px-4 py-3 flex items-center gap-3 text-left">
                        <span className="flex-1 min-w-0">
                          <span className="block text-[11px] font-extrabold tracking-[.12em] uppercase text-white/55">{ticketDate(s.date)}</span>
                          <span className="block text-[15px] font-bold text-white/70 truncate mt-1">{s.name}</span>
                        </span>
                        <span className="shrink-0 -rotate-[10deg] border-2 border-[#f47b6a]/70 text-[#f4a29a] rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-[.1em] text-center leading-tight uppercase">Tocado<br />{ticketDate(s.date).split(' ').slice(1).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {showDemo && (
              <section className="space-y-3 pt-1">
                <DemoBanner />
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white/70">Repertorios de demostración · {demoSets.length}</h2><span className="text-xs text-white/50">Solo lectura</span></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {demoSets.map((s, i) => (
                    <motion.button key={s.id} {...cardMotion(i)} onClick={() => open(s.id)} className="press-none glass rounded-3xl p-3.5 text-left min-h-[96px] flex flex-col justify-between gap-3">
                      <span className="text-[15px] font-bold leading-snug flex items-center gap-2">{s.name}<DemoTag /></span>
                      <span className="text-xs text-white/60">{s.date ? ticketDate(s.date) : 'Sin fecha'} · {meta(s)}</span>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {params.get('nuevo') === '1' && (
          <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setParams({})}>
            <form onSubmit={submit} className="glass-sheet rounded-3xl p-7 w-full max-w-md space-y-5">
              <div className="flex justify-between"><h2 className="font-display text-xl font-bold">Nuevo repertorio</h2><button type="button" onClick={() => setParams({})} aria-label="Cerrar"><X size={20} /></button></div>
              <label className="block text-sm text-white/60">Nombre del evento *<input required className="stage-input mt-2" placeholder="Ej. Noche en el teatro" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="block text-sm text-white/60">Lugar<input className="stage-input mt-2" placeholder="Ej. Sala principal" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
              <label className="block text-sm text-white/60">Fecha<input type="date" className="stage-input mt-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              {formError && <p role="alert" className="text-red-300 text-sm">{formError}</p>}
              <button disabled={busy} className="home-cta w-full h-12 rounded-full font-bold">{busy ? 'Guardando...' : 'Crear repertorio'}</button>
            </form>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
