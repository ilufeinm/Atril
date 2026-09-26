import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, FolderOpen, SlidersHorizontal, FolderPlus } from 'lucide-react';
import { useStage } from '@/components/stage/StageProvider';
import SongRow from '@/components/stage/SongRow';
import ImportDialog from '@/components/stage/ImportDialog';

const SORTS = [['recientes', 'Recientes'], ['titulo', 'Título'], ['artista', 'Artista'], ['bpm', 'BPM']];

export default function Library({ favoritesOnly = false }) {
  const { songs, loading, error } = useStage();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(favoritesOnly ? 'Favoritos' : 'Todas');
  const [folder, setFolder] = useState('Todas');
  const [sort, setSort] = useState('recientes');
  const [folderTick, setFolderTick] = useState(0);

  const customFolders = (() => { try { return JSON.parse(localStorage.getItem('stage-folders') || '[]'); } catch { return []; } })();
  const folders = ['Todas', ...new Set([...customFolders, ...songs.map((s) => s.folder).filter(Boolean)])];

  let visible = songs.filter((s) => (!favoritesOnly || s.favorite) && (filter !== 'Favoritos' || s.favorite) && (filter === 'Todas' || filter === 'Favoritos' || filter === 'Recientes' || s.type === filter) && (folder === 'Todas' || s.folder === folder) && `${s.title} ${s.artist} ${s.composer || ''} ${s.tags || ''}`.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'Recientes' || sort === 'recientes') visible = [...visible].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  else if (sort === 'titulo') visible = [...visible].sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'artista') visible = [...visible].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  else if (sort === 'bpm') visible = [...visible].sort((a, b) => (a.bpm || 0) - (b.bpm || 0));

  const newFolder = () => { const name = window.prompt('Nombre de la nueva carpeta'); if (name && name.trim()) { const list = [...new Set([...customFolders, name.trim()])]; localStorage.setItem('stage-folders', JSON.stringify(list)); setFolder(name.trim()); setFolderTick((t) => t + 1); } };

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[#c9ef72] uppercase tracking-[.2em] text-[11px] font-bold mb-2">TU ARCHIVO MUSICAL</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{favoritesOnly ? 'Favoritos' : 'Biblioteca'}</h1>
          <p className="text-white/45 text-sm mt-2">{favoritesOnly ? 'Las canciones que siempre quieres tener a mano.' : 'Toda tu música, siempre a mano.'}</p>
        </div>
        <button onClick={() => setParams({ importar: '1' })} className="shrink-0 h-11 px-4 rounded-xl bg-[#c9ef72] text-[#182017] font-bold text-sm flex items-center gap-2"><Plus size={18} /> <span className="hidden sm:inline">Importar partitura</span><span className="sm:hidden">Importar</span></button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" /><input aria-label="Buscar partituras" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, artista, compositor o etiqueta..." className="stage-input pl-11 h-12" /></label>
        <div className="relative"><FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={17} /><select aria-label="Carpeta" value={folder} onChange={(e) => setFolder(e.target.value)} className="stage-input h-12 pl-10 pr-8 min-w-[150px]">{folders.map((f) => <option key={f}>{f}</option>)}</select></div>
        <div className="relative"><SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} /><select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value)} className="stage-input h-12 pl-10 pr-8 min-w-[140px]">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <button onClick={newFolder} aria-label="Nueva carpeta" className="shrink-0 h-12 px-4 rounded-xl bg-white/10 text-sm flex items-center gap-2"><FolderPlus size={17} /> <span className="hidden sm:inline">Carpeta</span></button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">{['Todas', 'Recientes', 'Favoritos', 'Partitura', 'Chart', 'Acordes y letra'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-[#c9ef72] text-[#172013]' : 'bg-[#292d36] text-white/55 hover:text-white'}`}>{f}</button>)}</div>
      <div className="flex items-center justify-between"><h2 className="font-semibold">{visible.length} {visible.length === 1 ? 'partitura' : 'partituras'}</h2><span className="text-xs text-white/40">{filter === 'Recientes' ? 'Ordenadas por actividad' : 'Listas para tocar'}</span></div>
      {loading ? <p className="text-white/45">Cargando biblioteca...</p> : error ? <p role="alert" className="text-amber-300/80">{error}</p> : visible.length ? <div className="grid lg:grid-cols-2 gap-3">{visible.map((s) => <SongRow key={s.id} song={s} />)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/45">{songs.length ? 'No hay partituras que coincidan con tu búsqueda.' : 'Tu biblioteca está vacía. Importa tu primera partitura.'}</div>}
      {params.get('importar') === '1' && <ImportDialog onClose={() => setParams({})} />}
    </div>
  );
}