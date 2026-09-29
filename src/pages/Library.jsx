import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronDown } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';
import SongRow from '@/components/stage/SongRow';
import ImportDialog from '@/components/stage/ImportDialog';
import PullToRefresh from '@/components/stage/PullToRefresh';

const SORTS = [['recientes', 'Recientes'], ['titulo', 'Título'], ['artista', 'Artista'], ['bpm', 'BPM']];

export default function Library({ favoritesOnly = false }) {
  const { songs, loading, error, refresh } = useStage();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const favParam = params.get('fav') === '1';
  // Un único eje de filtro: 'favoritos' | nombre de carpeta | '' (todo)
  const [filter, setFilter] = useState((favoritesOnly || favParam) ? 'favoritos' : '');
  const [sort, setSort] = useState('recientes');
  const [sortOpen, setSortOpen] = useState(false);
  const [, setFolderTick] = useState(0);

  const customFolders = (() => { try { return JSON.parse(localStorage.getItem('stage-folders') || '[]'); } catch { return []; } })();
  const folders = [...new Set([...customFolders, ...songs.map((s) => s.folder).filter(Boolean)])];

  const matchSearch = (s) => `${s.title} ${s.artist} ${s.composer || ''} ${s.tags || ''}`.toLowerCase().includes(search.toLowerCase());
  const matchFilters = (s) => (!favoritesOnly || s.favorite) && (filter !== 'favoritos' || s.favorite) && (!filter || filter === 'favoritos' || s.folder === filter);
  const sortFn = (arr) => { if (sort === 'recientes') return [...arr].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)); if (sort === 'titulo') return [...arr].sort((a, b) => a.title.localeCompare(b.title)); if (sort === 'artista') return [...arr].sort((a, b) => (a.artist || '').localeCompare(b.artist || '')); if (sort === 'bpm') return [...arr].sort((a, b) => (a.bpm || 0) - (b.bpm || 0)); return arr; };
  let visible = sortFn(songs.filter((s) => matchFilters(s) && matchSearch(s)));

  const newFolder = () => { const name = window.prompt('Nombre de la nueva carpeta'); if (name && name.trim()) { const list = [...new Set([...customFolders, name.trim()])]; localStorage.setItem('stage-folders', JSON.stringify(list)); setFilter(name.trim()); setFolderTick((t) => t + 1); } };
  const sortLabel = SORTS.find(([v]) => v === sort)?.[1] || 'Recientes';

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[#8e9aaf] uppercase tracking-[.2em] text-[11px] font-bold mb-2">TU ARCHIVO MUSICAL</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{favoritesOnly ? 'Favoritos' : 'Biblioteca'}</h1>
          <p className="text-white/45 text-sm mt-2">{favoritesOnly ? 'Las canciones que siempre quieres tener a mano.' : 'Toda tu música, siempre a mano.'}</p>
        </div>
        <button onClick={() => setParams({ importar: '1' })} className="shrink-0 h-11 px-4 rounded-xl bg-[#8e9aaf] text-[#121212] font-bold text-sm flex items-center gap-2"><Plus size={18} /> <span className="hidden sm:inline">Importar partitura</span><span className="sm:hidden">Importar</span></button>
      </div>
      <label className="relative block"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Buscar partituras" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, artista, compositor o etiqueta..." className="stage-input pl-11 h-12 w-full" /></label>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setFilter(filter === 'favoritos' ? '' : 'favoritos')} className={`shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-semibold transition-colors ${filter === 'favoritos' ? 'bg-[#8e9aaf] text-[#121212]' : 'bg-[#1e1e22] text-white/55 hover:text-white border border-[#2b2b30]'}`}><Star size={13} fill="currentColor" /> Favoritos</button>
        {folders.map((f) => <button key={f} onClick={() => setFilter(filter === f ? '' : f)} className={`shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-[#8e9aaf] text-[#121212]' : 'bg-[#1e1e22] text-white/55 hover:text-white border border-[#2b2b30]'}`}>{f}</button>)}
        <button onClick={newFolder} aria-label="Nueva carpeta" className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1e1e22] text-white/55 hover:text-white border border-dashed border-[#2b2b30]"><Plus size={16} /></button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm">{visible.length} {visible.length === 1 ? 'partitura' : 'partituras'}</h2>
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#1e1e22] border border-[#2b2b30] text-xs font-semibold text-white/70 hover:text-white">Ordenar: {sortLabel} <ChevronDown size={14} /></button>
          {sortOpen && (<><button onClick={() => setSortOpen(false)} className="fixed inset-0 z-10" aria-label="Cerrar orden" /><div className="absolute right-0 top-10 z-20 w-36 rounded-xl bg-[#1e1e22] border border-[#2b2b30] py-1 shadow-xl">{SORTS.map(([v, l]) => <button key={v} onClick={() => { setSort(v); setSortOpen(false); }} className={`flex w-full items-center justify-between px-3 h-9 text-xs ${sort === v ? 'text-[#8e9aaf] font-bold' : 'text-white/70 hover:text-white'}`}>{l}{sort === v && <Star size={12} fill="currentColor" className="text-[#8e9aaf]" />}</button>)}</div></>)}
        </div>
      </div>
      {loading ? <p className="text-white/45">Cargando biblioteca...</p> : error ? <p role="alert" className="text-amber-300/80">{error}</p> : visible.length ? <div className="grid lg:grid-cols-2 gap-3">{visible.map((s) => <SongRow key={s.id} song={s} />)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/45">{songs.length ? 'No hay partituras que coincidan con tu búsqueda.' : 'Tu biblioteca está vacía. Importa tu primera partitura.'}</div>}
      {params.get('importar') === '1' && <ImportDialog onClose={() => setParams({})} />}
    </div>
    </PullToRefresh>
  );
}