import React, { useState, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Play, ChevronRight, FileMusic, Camera, Upload, Cloud, CloudOff, RotateCw, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger, SPRING, SPRING_SOFT, EASE_OUT } from '@/lib/motion';
import { CountUp } from '@/components/motion';
import { useStage } from '@/components/stage/StageProvider';
import { useToast } from '@/components/ui/use-toast';
import { localDateISO } from '@/lib/utils';
import { areSongsOffline, prepareSongsOffline } from '@/lib/offlineScores';

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
  const { songs, allSongs, sets, demoSets, demoHidden, user, loading, loadSets, loadFailed, refresh } = useStage();
  // Si la carga falla, no mostramos "0 partituras": el músico pensaría que perdió todo.
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try { await refresh(); } finally { setRetrying(false); }
  };
  const nav = useNavigate();
  React.useEffect(() => { loadSets(); }, [loadSets]);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const scanRef = useRef(null), uploadRef = useRef(null), photosRef = useRef(null);

  const today = localDateISO();
  const upcoming = [...sets, ...(demoHidden ? [] : demoSets)].filter((s) => s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const next = upcoming[0] || null;
  const songCount = next?.song_ids?.length || 0;

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

  const submitSearch = (e) => { e.preventDefault(); nav(`/biblioteca${q ? '?q=' + encodeURIComponent(q) : ''}`); };
  const firstName = user?.full_name?.split(' ')[0];

  const openImport = (file) => { setPendingFile(file || null); setDialogOpen(true); };
  const closeImport = (saved) => { setDialogOpen(false); setPendingFile(null); if (saved?.id) nav(`/en-vivo/${saved.id}`); };
  const onFilePicked = (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) openImport(f); };

  const IMPORTS = [
    { key: 'escanear', label: 'Escanear', Icon: Camera, onClick: () => scanRef.current?.click() },
    { key: 'subir', label: 'Subir archivo', Icon: Upload, onClick: () => uploadRef.current?.click() },
    // Drive todavía no funciona: se ve atenuado y con "Pronto" para no prometer algo que no anda.
    { key: 'drive', label: 'Drive', Icon: Cloud, soon: true, onClick: () => toast({ title: 'Importar desde Drive próximamente' }) },
    { key: 'fotos', label: 'Fotos', Icon: ImageIcon, onClick: () => photosRef.current?.click() },
  ];

  return (
    <motion.div className="space-y-8" variants={stagger()} initial="hidden" animate="show">
      {/* A. Saludo + contexto */}
      <motion.header variants={fadeUp} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          {!loadFailed && (
            <p className="text-[#a0a0a0] text-sm mt-1">
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
          className="press-none group w-11 h-11 rounded-full bg-[#8e9aaf] text-[#121212] flex items-center justify-center shrink-0"
        >
          <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
        </motion.button>
      </motion.header>

      {/* Buscador */}
      <motion.form variants={fadeUp} onSubmit={submitSearch} className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar partituras o artistas"
          className="w-full h-12 rounded-2xl bg-[#1e1e22] border border-[#2b2b30] pl-11 pr-4 text-sm text-white placeholder:text-[#a0a0a0] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#8e9aaf] focus:shadow-[0_0_0_4px_rgba(142,154,175,0.14)]"
        />
      </motion.form>

      {/* B. Próximo show */}
      <motion.section variants={fadeUp}>
        {loading ? (
          <div className="rounded-3xl bg-[#1e1e22] p-5 h-44 shimmer" />
        ) : next ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="rounded-3xl bg-[#1e1e22] p-5 border border-[#2b2b30]"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex w-2 h-2">
                {next.date === today && <span className="absolute inline-flex h-full w-full rounded-full bg-[#f47b6a] opacity-70 animate-ping" />}
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#f47b6a]" />
              </span>
              <span className="text-[#a0a0a0]">{fmtRel(next.date, next.time)}</span>
            </div>
            <h2 className="text-xl font-bold mt-3 flex items-center gap-2">{next.name}{next.is_demo && <DemoTag />}</h2>
            <p className="text-[#a0a0a0] text-sm mt-1">{next.venue || 'Lugar por definir'}{songCount ? ` · ${songCount} canciones` : ''}{offlineReady && ' · Listo sin conexión'}</p>
            <MotionLink
              to={`/presentacion/${next.id}`}
              whileHover={{ scale: 1.015, transition: SPRING_SOFT }}
              whileTap={{ scale: 0.97, transition: SPRING }}
              className="mt-5 w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm flex items-center justify-center gap-2"
            >
              <Play size={17} fill="currentColor" /> Tocar en vivo
            </MotionLink>
            <Link to={`/repertorios?abrir=${next.id}`} className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#8e9aaf]">
              Ver repertorio <ChevronRight size={16} />
            </Link>
          </motion.div>
        ) : loadFailed ? (
          <div role="alert" className="rounded-3xl bg-[#1e1e22] p-6 text-center border border-[#2b2b30]">
            <CloudOff size={22} className="mx-auto text-[#a0a0a0]" aria-hidden="true" />
            <p className="text-white/80 text-sm font-medium mt-3">No pudimos cargar tus partituras.</p>
            <p className="text-[#a0a0a0] text-xs mt-1">Revisá tu conexión y volvé a intentar. Tus partituras siguen guardadas.</p>
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="mt-4 inline-flex h-11 px-5 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm items-center gap-2 disabled:opacity-60"
            >
              <RotateCw size={16} className={retrying ? 'animate-spin' : ''} aria-hidden="true" />
              {retrying ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        ) : pool.length === 0 ? (
          // Primera vez: sin partituras no hay repertorio que armar. El primer paso es importar.
          <div className="rounded-3xl bg-[#1e1e22] p-6 text-center border border-dashed border-[#2b2b30]">
            <FileMusic size={22} className="mx-auto text-[#a0a0a0]" aria-hidden="true" />
            <p className="text-white/80 text-sm font-medium mt-3">Traé tu primera partitura</p>
            <p className="text-[#a0a0a0] text-xs mt-1">Escaneala o subí un PDF. Después armás el repertorio de tu próximo show.</p>
            <button
              type="button"
              onClick={() => openImport()}
              className="mt-4 inline-flex h-11 px-5 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm items-center gap-2"
            >
              <Plus size={16} aria-hidden="true" /> Importar partitura
            </button>
            <Link to="/repertorios?nuevo=1" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#8e9aaf]">
              Crear repertorio <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#1e1e22] p-6 text-center border border-dashed border-[#2b2b30]">
            <p className="text-white/80 text-sm font-medium">Prepará tu próximo show</p>
            <p className="text-[#a0a0a0] text-xs mt-1">Creá un repertorio y agregá tus canciones.</p>
            <Link to="/repertorios?nuevo=1" className="mt-4 inline-flex h-10 px-5 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm items-center gap-2">
              <Plus size={16} /> Crear repertorio
            </Link>
          </div>
        )}
      </motion.section>

      {/* C. Recientes: continuar + últimas partituras */}
      {recents.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[#a0a0a0] text-sm font-medium">Recientes</div>
            <Link to="/biblioteca" className="text-sm text-[#8e9aaf] font-medium">Ver todas</Link>
          </div>
          <MotionLink
            to={`/en-vivo/${recent.id}`}
            whileHover={{ y: -2, transition: SPRING_SOFT }}
            whileTap={{ scale: 0.98, transition: SPRING }}
            className="flex items-center gap-3 rounded-2xl bg-[#1e1e22] p-3.5 border border-[#2b2b30]"
          >
            <span className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center shrink-0">
              <FileMusic size={22} className="text-[#121212]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2 min-w-0"><span className="truncate">{recent.title}</span>{recent.is_demo && <DemoTag />}</div>
              <div className="text-[#a0a0a0] text-xs mt-0.5 truncate">
                {resumed ? `Página ${recent.last_page} de ${recent.pages || recent.last_page}` : (recent.artist || 'Partitura')} · {ago(recent.updated_date)}
              </div>
            </div>
            <span className="text-[#8e9aaf] text-sm font-medium">{resumed ? 'Continuar' : 'Abrir'}</span>
          </MotionLink>
          {recents.length > 1 && (
            <div className="divide-y divide-[#2b2b30] mt-1">
              {recents.slice(1, 5).map((s) => (
                <Link key={s.id} to={`/en-vivo/${s.id}`} className="group flex items-center gap-3 py-3 transition-transform duration-200 hover:translate-x-1">
                  <span className="w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                    <FileMusic size={18} className="text-[#121212]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2 min-w-0"><span className="truncate">{s.title}</span>{s.is_demo && <DemoTag />}</div>
                    <div className="text-[#a0a0a0] text-xs mt-0.5 truncate">{s.artist || 'Partitura'} · {ago(s.updated_date)}</div>
                  </div>
                  <ChevronRight size={16} className="text-white/30 shrink-0 transition-colors group-hover:text-white/70" />
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* E. Importar partitura */}
      <motion.section variants={fadeUp}>
        <div className="text-[#a0a0a0] text-sm font-medium mb-3">Importar partitura</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMPORTS.map(({ key, label, Icon, onClick, soon }) => (
            <motion.button
              key={key}
              onClick={onClick}
              aria-label={soon ? `${label} (próximamente)` : undefined}
              whileHover={soon ? undefined : { y: -3, transition: SPRING_SOFT }}
              whileTap={{ scale: 0.95, transition: SPRING }}
              className={`press-none group relative rounded-2xl bg-[#1e1e22] border border-[#2b2b30] p-4 flex flex-col items-center justify-center gap-2.5 transition-[border-color,box-shadow] duration-200 ${soon ? '' : 'hover:border-[#8e9aaf]/40 hover:shadow-lg hover:shadow-black/20'}`}
            >
              <span className={`w-10 h-10 rounded-full bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center transition-transform duration-300 ${soon ? 'opacity-60' : 'group-hover:scale-110'}`}><Icon size={18} /></span>
              <span className={`text-sm font-medium ${soon ? 'opacity-60' : ''}`}>{label}</span>
              {soon && <span className="absolute top-2 right-2.5 text-[11px] text-[#a0a0a0]">Pronto</span>}
            </motion.button>
          ))}
        </div>
        <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePicked} />
        <input ref={uploadRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFilePicked} />
        <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
      </motion.section>

      {dialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"><div className="w-7 h-7 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" /></div>}>
          <ImportDialog onClose={closeImport} initialFile={pendingFile} />
        </Suspense>
      )}
    </motion.div>
  );
}