import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Play, ChevronRight, FileMusic, Camera, Upload, Cloud, Image as ImageIcon } from 'lucide-react';
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

const greeting = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Home() {
  const { songs, sets, demoSets, user, loading } = useStage();
  const nav = useNavigate();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const scanRef = useRef(null), uploadRef = useRef(null), photosRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...sets, ...demoSets].filter((s) => s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
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
    <div className="space-y-8">
      {/* A. Saludo + contexto */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-[#a0a0a0] text-sm mt-1">
            {pool.length} partitura{pool.length === 1 ? '' : 's'}
            {next ? ` · próximo show: ${next.name}` : ' · sin shows programados'}
          </p>
        </div>
        <button onClick={() => openImport()} aria-label="Importar partitura" className="w-10 h-10 rounded-full bg-[#8e9aaf] text-[#121212] flex items-center justify-center shrink-0">
          <Plus size={20} />
        </button>
      </header>

      {/* Buscador */}
      <form onSubmit={submitSearch} className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar partituras o artistas"
          className="w-full h-12 rounded-2xl bg-[#1e1e22] border border-[#2b2b30] pl-11 pr-4 text-sm text-white placeholder:text-[#a0a0a0] outline-none focus:border-[#8e9aaf]"
        />
      </form>

      {/* B. Próximo show */}
      <section>
        {loading ? (
          <div className="rounded-3xl bg-[#1e1e22] p-5 h-44 animate-pulse" />
        ) : next ? (
          <div className="rounded-3xl bg-[#1e1e22] p-5 border border-[#2b2b30]">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#f47b6a]" />
              <span className="text-[#a0a0a0]">{fmtRel(next.date, next.time)}</span>
            </div>
            <h2 className="text-xl font-bold mt-3">Noche en el teatro</h2>
            <p className="text-[#a0a0a0] text-sm mt-1">Teatro Central{songCount ? ` · ${songCount} canciones` : ''}</p>
            <Link to={`/presentacion/${next.id}`} className="mt-5 w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm flex items-center justify-center gap-2">
              <Play size={17} fill="currentColor" /> Abrir presentación
            </Link>
            <Link to={`/repertorios?abrir=${next.id}`} className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#8e9aaf]">
              Ver repertorio <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#1e1e22] p-6 text-center border border-dashed border-[#2b2b30]">
            <p className="text-white/80 text-sm font-medium">Prepará tu próximo show</p>
            <p className="text-[#a0a0a0] text-xs mt-1">Crea un repertorio y agrega tus canciones.</p>
            <Link to="/repertorios?nuevo=1" className="mt-4 inline-flex h-10 px-5 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm items-center gap-2">
              <Plus size={16} /> Crear repertorio
            </Link>
          </div>
        )}
      </section>

      {/* C. Continuar donde lo dejaste */}
      {recent && (
        <section>
          <div className="text-[#a0a0a0] text-sm font-medium mb-3">Continuar</div>
          <Link to={`/en-vivo/${recent.id}`} className="flex items-center gap-3 rounded-2xl bg-[#1e1e22] p-3.5 border border-[#2b2b30]">
            <span className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center shrink-0">
              <FileMusic size={22} className="text-[#121212]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{recent.title}</div>
              <div className="text-[#a0a0a0] text-xs mt-0.5">Página {recent.last_page || 1} de {recent.pages || 1} · {ago(recent.updated_date)}</div>
            </div>
            <span className="text-[#8e9aaf] text-sm font-medium">Continuar</span>
          </Link>
        </section>
      )}

      {/* D. Partituras recientes */}
      {recents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[#a0a0a0] text-sm font-medium">Recientes</div>
            <Link to="/biblioteca" className="text-sm text-[#8e9aaf] font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-[#2b2b30]">
            {recents.map((s) => (
              <Link key={s.id} to={`/en-vivo/${s.id}`} className="flex items-center gap-3 py-3">
                <span className="w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                  <FileMusic size={18} className="text-[#121212]" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.title}</div>
                  <div className="text-[#a0a0a0] text-xs mt-0.5 truncate">{s.artist || 'Partitura'} · {ago(s.updated_date)}</div>
                </div>
                <ChevronRight size={16} className="text-white/30 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* E. Importar partitura */}
      <section>
        <div className="text-[#a0a0a0] text-sm font-medium mb-3">Importar partitura</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMPORTS.map(({ key, label, Icon, onClick }) => (
            <button key={key} onClick={onClick} className="rounded-2xl bg-[#1e1e22] border border-[#2b2b30] p-4 flex flex-col items-center gap-2.5 hover:border-[#8e9aaf]/40 transition-colors">
              <span className="w-10 h-10 rounded-full bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center"><Icon size={18} /></span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePicked} />
        <input ref={uploadRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFilePicked} />
        <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
      </section>

      {dialogOpen && <ImportDialog onClose={closeImport} initialFile={pendingFile} />}
    </div>
  );
}