import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Play, ChevronRight, FileMusic, Camera, Upload, Cloud, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger, SPRING, SPRING_SOFT, EASE_OUT } from '@/lib/motion';
import { CountUp } from '@/components/motion';
import { useStage } from '@/components/stage/StageProvider';
import ImportDialog from '@/components/stage/ImportDialog';
import { useToast } from '@/components/ui/use-toast';

const fmtRel = (date, time) => {
  if (!date) return 'Sin fecha';
  const now = new Date();
  const hhmm = time || '20:00';
  const d = new Date(date + 'T' + hhmm + ':00');
  const today = date === now.toISOString().slice(0, 10);
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

const greeting = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Home() {
  const { songs, sets, demoSets, demoHidden, user, loading, loadSets } = useStage();
  const nav = useNavigate();
  React.useEffect(() => { loadSets(); }, [loadSets]);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const scanRef = useRef(null), uploadRef = useRef(null), photosRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...sets, ...(demoHidden ? [] : demoSets)].filter((s) => s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const next = upcoming[0] || null;
  const songCount = next?.song_ids?.length || 0;

  const pool = [...songs];
  const recents = [...pool].sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || ''));
  const recent = recents[0];

  const submitSearch = (e) => { e.preventDefault(); nav(`/biblioteca${q ? '?q=' + encodeURIComponent(q) : ''}`); };
  const firstName = user?.full_name?.split(' ')[0];

  const openImport = (file) => { setPendingFile(file || null); setDialogOpen(true); };
  const closeImport = (saved) => { setDialogOpen(false); setPendingFile(null); if (saved?.id) nav(`/en-vivo/${saved.id}`); };
  const onFilePicked = (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) openImport(f); };

  const IMPORTS = [
    { key: 'escanear', label: 'Escanear', Icon: Camera, onClick: () => scanRef.current?.click() },
    { key: 'subir', label: 'Subir archivo', Icon: Upload, onClick: () => uploadRef.current?.click() },
    { key: 'drive', label: 'Drive', Icon: Cloud, onClick: () => toast({ title: 'Importar desde Drive próximamente' }) },
    { key: 'fotos', label: 'Fotos', Icon: ImageIcon, onClick: () => photosRef.current?.click() },
  ];

  return (
    <motion.div className="space-y-8" variants={stagger(0.07, 0.02)} initial="hidden" animate="show">
      {/* A. Saludo + contexto */}
      <motion.header variants={fadeUp} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-[#a0a0a0] text-sm mt-1">
            <CountUp value={pool.length} /> partitura{pool.length === 1 ? '' : 's'}
            {next ? ` · próximo show: ${next.name}` : ' · sin shows programados'}
          </p>
        </div>
        <motion.button
          onClick={() => openImport()}
          aria-label="Importar partitura"
          whileHover={{ scale: 1.08, transition: SPRING_SOFT }}
          whileTap={{ scale: 0.88, transition: SPRING }}
          className="press-none group w-10 h-10 rounded-full bg-[#8e9aaf] text-[#121212] flex items-center justify-center shrink-0 anim-glow"
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
            <h2 className="text-xl font-bold mt-3">{next.name}</h2>
            <p className="text-[#a0a0a0] text-sm mt-1">{next.venue || 'Lugar por definir'}{songCount ? ` · ${songCount} canciones` : ''}</p>
            <MotionLink
              to={`/presentacion/${next.id}`}
              whileHover={{ scale: 1.015, transition: SPRING_SOFT }}
              whileTap={{ scale: 0.97, transition: SPRING }}
              className="mt-5 w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm flex items-center justify-center gap-2"
            >
              <Play size={17} fill="currentColor" /> Abrir presentación
            </MotionLink>
            <Link to={`/repertorios?abrir=${next.id}`} className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#8e9aaf]">
              Ver repertorio <ChevronRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-[#1e1e22] p-6 text-center border border-dashed border-[#2b2b30]">
            <p className="text-white/80 text-sm font-medium">Prepará tu próximo show</p>
            <p className="text-[#a0a0a0] text-xs mt-1">Crea un repertorio y agrega tus canciones.</p>
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
              <div className="font-semibold text-sm truncate">{recent.title}</div>
              <div className="text-[#a0a0a0] text-xs mt-0.5">Página {recent.last_page || 1} de {recent.pages || 1} · {ago(recent.updated_date)}</div>
            </div>
            <span className="text-[#8e9aaf] text-sm font-medium">Continuar</span>
          </MotionLink>
          {recents.length > 1 && (
            <div className="divide-y divide-[#2b2b30] mt-1">
              {recents.slice(1, 5).map((s) => (
                <Link key={s.id} to={`/en-vivo/${s.id}`} className="group flex items-center gap-3 py-3 transition-transform duration-200 hover:translate-x-1">
                  <span className="w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                    <FileMusic size={18} className="text-[#121212]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.title}</div>
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
          {IMPORTS.map(({ key, label, Icon, onClick }) => (
            <motion.button
              key={key}
              onClick={onClick}
              whileHover={{ y: -3, transition: SPRING_SOFT }}
              whileTap={{ scale: 0.95, transition: SPRING }}
              className="press-none group rounded-2xl bg-[#1e1e22] border border-[#2b2b30] p-4 flex flex-col items-center gap-2.5 hover:border-[#8e9aaf]/40 hover:shadow-lg hover:shadow-black/20 transition-[border-color,box-shadow] duration-200"
            >
              <span className="w-10 h-10 rounded-full bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"><Icon size={18} /></span>
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          ))}
        </div>
        <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePicked} />
        <input ref={uploadRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFilePicked} />
        <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
      </motion.section>

      {dialogOpen && <ImportDialog onClose={closeImport} initialFile={pendingFile} />}
    </motion.div>
  );
}