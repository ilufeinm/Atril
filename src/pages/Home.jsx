import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Play, ChevronDown, Check, FileMusic } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';

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

export default function Home() {
  const { songs, sets, demoSets, loading } = useStage();
  const nav = useNavigate();
  const [q, setQ] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...sets].filter((s) => s.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const next = upcoming[0] || sets[0] || demoSets[0];
  const songCount = next?.song_ids?.length || 0;

  const pool = songs.length ? songs : demoSets.length ? [] : [];
  const recent = [...pool].sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || ''))[0];

  const submitSearch = (e) => { e.preventDefault(); nav(`/biblioteca${q ? '?q=' + encodeURIComponent(q) : ''}`); };

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
        <Link to="/biblioteca?importar=1" aria-label="Importar partitura" className="w-10 h-10 rounded-full bg-[#8e9aaf] text-[#121212] flex items-center justify-center shrink-0">
          <Plus size={20} />
        </Link>
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

      {/* Próxima presentación */}
      <section>
        <div className="text-[#a0a0a0] text-sm font-medium mb-3">Próxima presentación</div>
        {loading ? (
          <div className="rounded-3xl bg-[#1e1e22] p-5 h-40 animate-pulse" />
        ) : next ? (
          <div className="rounded-3xl bg-[#1e1e22] p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#f47b6a]" />
              <span className="text-[#a0a0a0]">{fmtRel(next.date, next.time)}</span>
            </div>
            <h2 className="text-xl font-bold mt-3">{next.name}</h2>
            <p className="text-[#a0a0a0] text-sm mt-1">{next.venue || 'Lugar por definir'}{songCount ? `, ${songCount} canciones` : ''}</p>
            <ul className="mt-4 space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm">
                <Check size={17} className="text-[#8e9aaf] mt-0.5 shrink-0" />
                <span className="text-white/90">Las {songCount} partituras están disponibles sin conexión</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <Check size={17} className="text-[#8e9aaf] mt-0.5 shrink-0" />
                <span className="text-white/90">Setlist listo para presentar</span>
              </li>
            </ul>
            <Link to={`/presentacion/${next.id}`} className="mt-5 w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold text-sm flex items-center justify-center gap-2">
              <Play size={17} fill="currentColor" /> Empezar presentación
            </Link>
            <Link to={`/repertorios?abrir=${next.id}`} className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#8e9aaf]">
              Ver las {songCount} canciones <ChevronDown size={16} />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#1e1e22] p-6 text-center">
            <p className="text-[#a0a0a0] text-sm">Aún no tienes presentaciones programadas.</p>
            <Link to="/repertorios?nuevo=1" className="mt-3 inline-flex text-[#8e9aaf] text-sm font-medium">Crear repertorio</Link>
          </div>
        )}
      </section>

      {/* Retomar */}
      {recent && (
        <section>
          <div className="text-[#a0a0a0] text-sm font-medium mb-3">Retomar</div>
          <Link to={`/visor/${recent.id}`} className="flex items-center gap-3 rounded-2xl bg-[#1e1e22] p-3.5">
            <span className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center shrink-0">
              <FileMusic size={22} className="text-[#121212]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{recent.title}</div>
              <div className="text-[#a0a0a0] text-xs mt-0.5">Página {recent.last_page || 1} de {recent.pages || 3} · {recent.artist || 'Partitura'}</div>
            </div>
            <span className="text-[#8e9aaf] text-sm font-medium">Abrir</span>
          </Link>
        </section>
      )}
    </div>
  );
}