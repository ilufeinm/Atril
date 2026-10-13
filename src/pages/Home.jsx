import React, { useState, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Play, ChevronRight, FileMusic, Camera, Upload, Cloud, CloudOff, RotateCw, Image as ImageIcon, Check, Users, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger, SPRING, SPRING_SOFT } from '@/lib/motion';
import { CountUp } from '@/components/motion';
import { useStage } from '@/components/stage/StageProvider';
import { useToast } from '@/components/ui/use-toast';
import { localDateISO } from '@/lib/utils';
import { areSongsOffline, prepareSongsOffline } from '@/lib/offlineScores';
import { PageBackdrop, PaperThumb, Ticket, tile } from '@/components/glass';

// ImportDialog arrastra pdfjs-dist (pesado). Se carga solo al abrir el diálogo.
const ImportDialog = lazy(() => import('@/components/stage/ImportDialog'));

const fmtRel = (date, time) => {
  if (!date) return 'Sin fecha';
  const now = new Date();
  const hhmm = time || '20:00';
  const d = new Date(date + 'T' + hhmm + ':00');
  const today = date === localDateISO(now);
  if (today) {
    const mins = Math.round((d - now) / 60000);
    if (mins > 0) {
      const h = Math.floor(mins / 60), m = mins % 60;
      return `Hoy, ${hhmm}, en ${h ? h + ' h ' : ''}${m ? m + ' min' : ''}`.trim();
    }
    return `Hoy, ${hhmm}`;
  }
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long' }) + (time ? `, ${time}` : '');
};

// "En 12 días" / "Mañana" para la entrada del show (vacío si es hoy: fmtRel ya lo dice).
const daysLeft = (date) => {
  if (!date) return '';
  const a = new Date(localDateISO() + 'T12:00:00'), b = new Date(date + 'T12:00:00');
  const n = Math.round((b - a) / 86400000);
  return n <= 0 ? '' : n === 1 ? 'Mañana' : `En ${n} días`;
};

const ago = (iso) => {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
};

const fmtDur = (s) => { const t = Math.round(s || 0); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const MotionLink = motion.create(Link);

// Misma etiqueta "Demo" que usan Bandas, Repertorios y el banner de demostración.
const DemoTag = () => (
  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span>
);

const greeting = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Home() {
  const { songs, allSongs, sets, demoSets, demoHidden, user, loading, loadSets, loadFailed, refresh, allBands, allRecordings, loadBands, loadRecordings } = useStage();
  // Si la carga falla, no mostramos "0 partituras": el músico pensaría que perdió todo.
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try { await refresh(); } finally { setRetrying(false); }
  };
  const nav = useNavigate();
  React.useEffect(() => { loadSets(); }, [loadSets]);
  // Banda y última grabación para el bento (se cargan una sola vez).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { loadBands(); loadRecordings(); }, []);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const scanRef = useRef(null), uploadRef = useRef(null), photosRef = useRef(null);
  const railRef = useRef(null);
  const [slide, setSlide] = useState(0);

  const today = localDateISO();
  const upcoming = [...sets, ...(demoHidden ? [] : demoSets)].filter((s) => s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const next = upcoming[0] || null;

  // Próximo show listo sin conexión: con internet, se descargan en segundo plano sus partituras
  // (páginas y datos). La etiqueta aparece solo cuando de verdad está todo guardado en el dispositivo.
  const [offlineReady, setOfflineReady] = useState(false);
  const nextIds = (next?.song_ids || []).join('|');
  React.useEffect(() => {
    setOfflineReady(false);
    const ids = next?.song_ids || [];
    const list = ids.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);
    if (!list.length || list.length !== ids.length) return undefined;
    let cancelled = false;
    (async () => {
      if (!(await areSongsOffline(list))) await prepareSongsOffline(list);
      const ok = await areSongsOffline(list);
      if (!cancelled) setOfflineReady(ok);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.id, nextIds, allSongs.length]);

  const pool = [...songs];
  const recents = [...pool].sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || ''));
  const recent = recents[0];
  // "Continuar" solo si de verdad quedó a mitad de camino (página guardada mayor a 1).
  const resumed = (recent?.last_page || 0) > 1;
  const progress = resumed && recent?.pages ? Math.min(100, Math.round((recent.last_page / recent.pages) * 100)) : 0;

  const band = (allBands || []).find((b) => !b.is_demo) || (!demoHidden && (allBands || []).find((b) => b.is_demo)) || null;
  const lastRec = (allRecordings || [])[0] || null;

  const submitSearch = (e) => { e.preventDefault(); nav(`/biblioteca${q ? '?q=' + encodeURIComponent(q) : ''}`); };
  const firstName = user?.full_name?.split(' ')[0];

  const openImport = (file) => { setPendingFile(file || null); setDialogOpen(true); };
  const closeImport = (saved) => { setDialogOpen(false); setPendingFile(null); if (saved?.id) nav(`/en-vivo/${saved.id}`); };
  const onFilePicked = (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) openImport(f); };

  const IMPORTS = [
    { key: 'escanear', label: 'Escanear', Icon: Camera, onClick: () => scanRef.current?.click() },
    { key: 'subir', label: 'Subir archivo', Icon: Upload, onClick: () => uploadRef.current?.click() },
    { key: 'fotos', label: 'Fotos', Icon: ImageIcon, onClick: () => photosRef.current?.click() },
    // Drive todavía no funciona: se ve atenuado y con "Pronto" para no prometer algo que no anda.
    { key: 'drive', label: 'Drive', Icon: Cloud, soon: true, onClick: () => toast({ title: 'Importar desde Drive próximamente' }) },
  ];

  // Carrusel de entradas: el punto activo sigue al desplazamiento.
  const onRailScroll = () => {
    const el = railRef.current;
    if (!el || !el.firstElementChild) return;
    const w = el.firstElementChild.getBoundingClientRect().width + 12;
    setSlide(Math.round(el.scrollLeft / w));
  };

  return (
    <motion.div className="relative" variants={stagger()} initial="hidden" animate="show">
      <PageBackdrop motif="score" />

      <div className="relative space-y-5">
        {/* Saludo + importar */}
        <motion.header variants={fadeUp} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-tight font-bold tracking-tight">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
            {!loadFailed && (
              <p className="text-white/70 text-sm mt-1">
                <CountUp value={pool.length} /> partitura{pool.length === 1 ? '' : 's'}
                {next ? ` · próximo show: ${next.name}` : ' · sin shows programados'}
              </p>
            )}
          </div>
          <motion.button
            onClick={() => openImport()}
            aria-label="Importar partitura"
            whileHover={{ scale: 1.08, transition: SPRING_SOFT }}
            whileTap={{ scale: 0.88, transition: SPRING }}
            className="press-none group glass w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0"
          >
            <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
          </motion.button>
        </motion.header>

        {/* Buscador */}
        <motion.form variants={fadeUp} onSubmit={submitSearch} className="relative">
          <Search size={18} className="absolute z-[1] pointer-events-none left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar partituras o artistas"
            aria-label="Buscar partituras o artistas"
            className="glass w-full h-12 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/60 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#8e9aaf] focus:shadow-[0_0_0_4px_rgba(142,154,175,0.18)]"
          />
        </motion.form>

        {/* Tus fechas: entradas de vidrio que se deslizan de costado */}
        <motion.section variants={fadeUp} aria-label="Próximos shows">
          {loading ? (
            <div className="glass-ticket rounded-[26px] h-[232px] shimmer" />
          ) : upcoming.length ? (
            <>
              <div
                ref={railRef}
                onScroll={onRailScroll}
                className="no-scrollbar -mx-4 sm:-mx-8 px-4 sm:px-8 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8"
              >
                {upcoming.map((s, i) => {
                  const isNext = i === 0;
                  const count = s.song_ids?.length || 0;
                  const left = daysLeft(s.date);
                  return (
                    <Ticket
                      key={s.id}
                      className={`snap-start shrink-0 ${upcoming.length > 1 ? 'w-[86%] max-w-[360px]' : 'w-full max-w-[520px]'}`}
                      stub={(
                        <>
                          <Link to={`/repertorios?abrir=${s.id}`} className="flex-1 min-w-0 flex items-center gap-0.5 text-[13px] whitespace-nowrap text-white/70">
                            Ver repertorio <ChevronRight size={15} />
                          </Link>
                          <MotionLink
                            to={`/presentacion/${s.id}`}
                            whileHover={{ scale: 1.03, transition: SPRING_SOFT }}
                            whileTap={{ scale: 0.96, transition: SPRING }}
                            className="home-cta h-12 px-4 rounded-full font-bold text-[13px] flex items-center gap-2 shrink-0"
                          >
                            <Play size={15} fill="currentColor" /> Tocar en vivo
                          </MotionLink>
                        </>
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold tracking-[.12em] uppercase">
                        <span className="flex items-center gap-2 text-white/70 min-w-0">
                          <span className="relative flex w-2 h-2 shrink-0">
                            {s.date === today && <span className="absolute inline-flex h-full w-full rounded-full bg-[#f47b6a] opacity-70 animate-ping" />}
                            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#f47b6a]" />
                          </span>
                          <span className="truncate">{fmtRel(s.date, s.time)}</span>
                        </span>
                        {left && <span className="text-[#f47b6a] shrink-0">{left}</span>}
                      </div>
                      <h2 className="font-display text-[26px] font-extrabold leading-[1.05] tracking-tight mt-2.5 flex items-center gap-2 min-w-0">
                        <span className="truncate">{s.name}</span>{s.is_demo && <DemoTag />}
                      </h2>
                      <p className="text-white/70 text-sm mt-1.5">
                        {s.venue || 'Lugar por definir'}{count ? ` · ${count} canciones` : ''}
                      </p>
                      {isNext && offlineReady && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#c9ef72]"><Check size={13} strokeWidth={3} /> Listo sin conexión</p>
                      )}
                    </Ticket>
                  );
                })}
              </div>
              {upcoming.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3" aria-hidden="true">
                  {upcoming.map((s, i) => (
                    <span key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-[18px] bg-[#8e9aaf]' : 'w-1.5 bg-white/30'}`} />
                  ))}
                </div>
              )}
            </>
          ) : loadFailed ? (
            <div role="alert" className="glass-ticket rounded-[26px] p-6 text-center">
              <CloudOff size={22} className="mx-auto text-white/60" aria-hidden="true" />
              <p className="text-white text-sm font-medium mt-3">No pudimos cargar tus partituras.</p>
              <p className="text-white/60 text-xs mt-1">Revisá tu conexión y volvé a intentar. Tus partituras siguen guardadas.</p>
              <button
                type="button"
                onClick={retry}
                disabled={retrying}
                className="home-cta mt-4 inline-flex h-11 px-5 rounded-full font-bold text-sm items-center gap-2 disabled:opacity-60"
              >
                <RotateCw size={16} className={retrying ? 'animate-spin' : ''} aria-hidden="true" />
                {retrying ? 'Reintentando…' : 'Reintentar'}
              </button>
            </div>
          ) : pool.length === 0 ? (
            // Primera vez: sin partituras no hay repertorio que armar. El primer paso es importar.
            <div className="glass-ticket rounded-[26px] p-6 text-center">
              <FileMusic size={22} className="mx-auto text-white/60" aria-hidden="true" />
              <p className="text-white text-sm font-medium mt-3">Traé tu primera partitura</p>
              <p className="text-white/60 text-xs mt-1">Escaneala o subí un PDF. Después armás el repertorio de tu próximo show.</p>
              <button
                type="button"
                onClick={() => openImport()}
                className="home-cta mt-4 inline-flex h-11 px-5 rounded-full font-bold text-sm items-center gap-2"
              >
                <Plus size={16} aria-hidden="true" /> Importar partitura
              </button>
              <Link to="/repertorios?nuevo=1" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/70">
                Crear repertorio <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="glass-ticket rounded-[26px] p-6 text-center">
              <p className="text-white text-sm font-medium">Prepará tu próximo show</p>
              <p className="text-white/60 text-xs mt-1">Creá un repertorio y agregá tus canciones.</p>
              <Link to="/repertorios?nuevo=1" className="home-cta mt-4 inline-flex h-11 px-5 rounded-full font-bold text-sm items-center gap-2">
                <Plus size={16} /> Crear repertorio
              </Link>
            </div>
          )}
        </motion.section>

        {/* Bento: seguir, importar, banda y última grabación */}
        <motion.section variants={fadeUp} className="grid grid-cols-2 gap-3" aria-label="Accesos rápidos">
          {recent && (
            <MotionLink
              to={`/en-vivo/${recent.id}`}
              whileTap={{ scale: 0.98, transition: SPRING }}
              className={`${tile} col-span-2 flex items-center gap-3.5`}
            >
              <PaperThumb className="w-11 h-14 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-white/65">{resumed ? 'Seguí donde quedaste' : 'Lo último que abriste'}</span>
                <span className="flex items-center gap-2 min-w-0 font-bold text-[15px] mt-0.5"><span className="truncate">{recent.title}</span>{recent.is_demo && <DemoTag />}</span>
                <span className="block text-xs text-white/60 mt-0.5 truncate">
                  {resumed ? `Página ${recent.last_page} de ${recent.pages || recent.last_page}` : (recent.artist || 'Partitura')} · {ago(recent.updated_date)}
                </span>
                {progress > 0 && <span className="block h-1 rounded-full bg-white/10 mt-2 overflow-hidden"><span className="block h-1 rounded-full bg-[#8e9aaf]" style={{ width: `${progress}%` }} /></span>}
              </span>
              <span className="text-sm font-semibold text-white">{resumed ? 'Continuar' : 'Abrir'}</span>
            </MotionLink>
          )}

          <div className={`${tile} col-span-2`}>
            <div className="text-xs text-white/65 mb-2.5">Importar partitura</div>
            <div className="grid grid-cols-4 gap-2">
              {IMPORTS.map(({ key, label, Icon, onClick, soon }) => (
                <motion.button
                  key={key}
                  type="button"
                  onClick={onClick}
                  aria-label={soon ? `${label} (próximamente)` : label}
                  whileTap={{ scale: 0.94, transition: SPRING }}
                  className="press-none relative flex flex-col items-center gap-1.5 py-1.5 rounded-2xl"
                >
                  <span className={`w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center ${soon ? 'opacity-50' : ''}`}><Icon size={19} /></span>
                  <span className={`text-xs font-medium text-white ${soon ? 'opacity-50' : ''}`}>{label}</span>
                  {soon && <span className="absolute -top-0.5 right-0 text-[10px] text-white/60">Pronto</span>}
                </motion.button>
              ))}
            </div>
          </div>

          {band && (
            <Link to={`/modo-banda/${band.id}`} className={`${tile} ${lastRec ? '' : 'col-span-2'} min-h-[104px] flex flex-col justify-between gap-3`}>
              <span className="w-10 h-10 rounded-xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center font-extrabold"><Users size={18} /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 min-w-0 text-sm font-bold"><span className="truncate">{band.name}</span>{band.is_demo && <DemoTag />}</span>
                <span className="block text-xs text-white/60 mt-0.5">Tu banda</span>
              </span>
            </Link>
          )}
          {lastRec && (
            <Link to={`/grabaciones/${lastRec.id}`} className={`${tile} ${band ? '' : 'col-span-2'} min-h-[104px] flex flex-col justify-between gap-3`}>
              <span className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"><Mic size={18} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-bold truncate">{lastRec.name || 'Última grabación'}</span>
                <span className="block text-xs text-white/60 mt-0.5">{lastRec.duration ? `${fmtDur(lastRec.duration)} · ` : ''}{ago(lastRec.date || lastRec.created_date)}</span>
              </span>
            </Link>
          )}
        </motion.section>

        {/* Recientes */}
        {recents.length > 1 && (
          <motion.section variants={fadeUp}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white/70">Recientes</h2>
              <Link to="/biblioteca" className="text-sm text-[#8e9aaf] font-medium">Ver todas</Link>
            </div>
            <div className="glass rounded-3xl px-3.5 divide-y divide-white/10">
              {recents.slice(1, 5).map((s) => (
                <Link key={s.id} to={`/en-vivo/${s.id}`} className="group flex items-center gap-3 py-3 transition-transform duration-200 hover:translate-x-1">
                  <span className="w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                    <FileMusic size={18} className="text-[#121212]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2 min-w-0"><span className="truncate">{s.title}</span>{s.is_demo && <DemoTag />}</div>
                    <div className="text-white/60 text-xs mt-0.5 truncate">{s.artist || 'Partitura'} · {ago(s.updated_date)}</div>
                  </div>
                  <ChevronRight size={16} className="text-white/30 shrink-0 transition-colors group-hover:text-white/70" />
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePicked} />
        <input ref={uploadRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFilePicked} />
        <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
      </div>

      {dialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"><div className="w-7 h-7 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" /></div>}>
          <ImportDialog onClose={closeImport} initialFile={pendingFile} />
        </Suspense>
      )}
    </motion.div>
  );
}
