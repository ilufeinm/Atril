import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronDown, List, LayoutGrid, CheckSquare, X, ListMusic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import SongRow from '@/components/stage/SongRow';
import SongCard from '@/components/stage/SongCard';
import AlphabetBar from '@/components/stage/AlphabetBar';
import SongActionSheet from '@/components/stage/SongActionSheet';
import BulkActionBar from '@/components/stage/BulkActionBar';
import ImportDialog from '@/components/stage/ImportDialog';
import PullToRefresh from '@/components/stage/PullToRefresh';

const SORTS = [['recientes', 'Recientes'], ['titulo', 'Título'], ['artista', 'Artista'], ['bpm', 'BPM']];

export default function Library({ favoritesOnly = false }) {
  const { songs, sets, loading, error, refresh, loadSets } = useStage();
  const [params, setParams] = useSearchParams();
  React.useEffect(() => { loadSets(); }, [loadSets]);
  const search = params.get('q') || '';
  const setSearch = (v) => {
    const sp = new URLSearchParams(params);
    if (v) sp.set('q', v); else sp.delete('q');
    setParams(sp, { replace: true });
  };
  const favParam = params.get('fav') === '1';
  const [filter, setFilter] = useState((favoritesOnly || favParam) ? 'favoritos' : '');
  const [sort, setSort] = useState('recientes');
  const [sortOpen, setSortOpen] = useState(false);
  const [, setFolderTick] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionSong, setActionSong] = useState(null);
  const [showSetlistPicker, setShowSetlistPicker] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const sentinelRef = useRef(null);
  const groupRefs = useRef({});

  const customFolders = (() => { try { return JSON.parse(localStorage.getItem('stage-folders') || '[]'); } catch { return []; } })();
  const folders = [...new Set([...customFolders, ...songs.map((s) => s.folder).filter(Boolean)])];

  const matchSearch = (s) => `${s.title} ${s.artist} ${s.composer || ''} ${s.tags || ''}`.toLowerCase().includes(search.toLowerCase());
  const matchFilters = (s) => (!favoritesOnly || s.favorite) && (filter !== 'favoritos' || s.favorite) && (!filter || filter === 'favoritos' || s.folder === filter);
  const sortFn = (arr) => { if (sort === 'recientes') return [...arr].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)); if (sort === 'titulo') return [...arr].sort((a, b) => a.title.localeCompare(b.title)); if (sort === 'artista') return [...arr].sort((a, b) => (a.artist || '').localeCompare(b.artist || '')); if (sort === 'bpm') return [...arr].sort((a, b) => (a.bpm || 0) - (b.bpm || 0)); return arr; };
  let visible = sortFn(songs.filter((s) => matchFilters(s) && matchSearch(s)));
  const displayed = visible.slice(0, displayCount);
  const hasMore = displayCount < visible.length;

  // Reset paginación al cambiar búsqueda/filtro/orden
  useEffect(() => { setDisplayCount(50); }, [search, filter, sort]);

  // Scroll infinito: IntersectionObserver en el sentinel
  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setDisplayCount((c) => c + 50);
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, displayed.length]);

  const grouped = {};
  if (sort === 'titulo') {
    displayed.forEach((s) => { let l = (s.title[0] || '#').toUpperCase(); if (!/[A-Z]/.test(l)) l = '#'; (grouped[l] = grouped[l] || []).push(s); });
  }
  const letters = Object.keys(grouped).sort();
  const showAZ = sort === 'titulo' && visible.length > 8 && viewMode === 'list';

  const newFolder = () => { const name = window.prompt('Nombre de la nueva carpeta'); if (name && name.trim()) { const list = [...new Set([...customFolders, name.trim()])]; localStorage.setItem('stage-folders', JSON.stringify(list)); setFilter(name.trim()); setFolderTick((t) => t + 1); } };
  const sortLabel = SORTS.find(([v]) => v === sort)?.[1] || 'Recientes';

  const toggleSelect = (id) => setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const jumpToLetter = (letter) => groupRefs.current[letter]?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  const bulkFavorite = async () => {
    const ids = [...selectedIds];
    const allFav = ids.every((id) => songs.find((s) => s.id === id)?.favorite);
    setBulkBusy(true);
    try { await base44.entities.Song.bulkUpdate(ids.map((id) => ({ id, favorite: !allFav }))); await refresh(); exitSelection(); } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
  };
  const bulkMoveFolder = async () => {
    const folder = window.prompt('Mover a la carpeta (escribí el nombre)');
    if (!folder) return;
    setBulkBusy(true);
    try { await base44.entities.Song.bulkUpdate([...selectedIds].map((id) => ({ id, folder: folder.trim() }))); await refresh(); exitSelection(); } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
  };
  const bulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.size} partituras? Esta acción no se puede deshacer.`)) return;
    setBulkBusy(true);
    try { await Promise.all([...selectedIds].map((id) => base44.entities.Song.delete(id))); await refresh(); exitSelection(); } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
  };
  const bulkAddToSetlist = async (setId) => {
    const setlist = sets.find((s) => s.id === setId);
    if (!setlist) return;
    const existing = new Set(setlist.song_ids || []);
    const newIds = [...selectedIds].filter((id) => !existing.has(id));
    setBulkBusy(true);
    try { await base44.entities.Setlist.update(setId, { song_ids: [...(setlist.song_ids || []), ...newIds] }); setShowSetlistPicker(false); await refresh(); exitSelection(); } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
  };

  const renderSong = (s) => (
    <SongRow key={s.id} song={s} query={search} selectionMode={selectionMode} selected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onLongPress={setActionSong} />
  );

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
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm whitespace-nowrap">{visible.length} {visible.length === 1 ? 'partitura' : 'partituras'}</h2>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#1e1e22] border border-[#2b2b30] rounded-full p-0.5">
              <button onClick={() => setViewMode('list')} aria-label="Vista de lista" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/50'}`}><List size={15} /></button>
              <button onClick={() => setViewMode('grid')} aria-label="Vista de grilla" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/50'}`}><LayoutGrid size={15} /></button>
            </div>
            <div className="relative">
              <button onClick={() => setSortOpen((o) => !o)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#1e1e22] border border-[#2b2b30] text-xs font-semibold text-white/70 hover:text-white"><span className="hidden sm:inline">Ordenar: </span>{sortLabel} <ChevronDown size={14} /></button>
              {sortOpen && (<><button onClick={() => setSortOpen(false)} className="fixed inset-0 z-10" aria-label="Cerrar orden" /><div className="absolute right-0 top-10 z-20 w-36 rounded-xl bg-[#1e1e22] border border-[#2b2b30] py-1 shadow-xl">{SORTS.map(([v, l]) => <button key={v} onClick={() => { setSort(v); setSortOpen(false); }} className={`flex w-full items-center justify-between px-3 h-9 text-xs ${sort === v ? 'text-[#8e9aaf] font-bold' : 'text-white/70 hover:text-white'}`}>{l}{sort === v && <Star size={12} fill="currentColor" className="text-[#8e9aaf]" />}</button>)}</div></>)}
            </div>
            <button onClick={() => { if (selectionMode) exitSelection(); else setSelectionMode(true); }} className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold transition-colors shrink-0 ${selectionMode ? 'bg-[#8e9aaf] text-[#121212]' : 'bg-[#1e1e22] border border-[#2b2b30] text-white/70 hover:text-white'}`}><CheckSquare size={14} /> <span className="hidden sm:inline">{selectionMode ? 'Hecho' : 'Seleccionar'}</span></button>
          </div>
        </div>
        {loading ? <p className="text-white/45">Cargando biblioteca...</p> : error ? <p role="alert" className="text-amber-300/80">{error}</p> : visible.length ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayed.map((s) => <SongCard key={s.id} song={s} query={search} selectionMode={selectionMode} selected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onLongPress={setActionSong} />)}
            </div>
          ) : showAZ ? (
            <div className={`relative space-y-1 ${selectionMode ? '' : 'pr-4'}`}>
              {letters.map((letter) => (
                <div key={letter} ref={(el) => { if (el) groupRefs.current[letter] = el; }} className="scroll-mt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)]">
                  <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 bg-[#1e1e22]/95 backdrop-blur-sm px-3 py-1.5 text-[#8e9aaf] font-bold text-sm border-b border-white/5 rounded-t-lg">{letter}</div>
                  <div className="space-y-2 pt-2 pb-1">{grouped[letter].map(renderSong)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">{displayed.map(renderSong)}</div>
          )
        ) : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/45">{songs.length ? 'No hay partituras que coincidan con tu búsqueda.' : 'Tu biblioteca está vacía. Importa tu primera partitura.'}</div>}

        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-6 text-white/40 text-sm">
            <span className="w-4 h-4 border-2 border-white/20 border-t-[#8e9aaf] rounded-full animate-spin" />
            Cargando más partituras…
          </div>
        )}

        {showAZ && <AlphabetBar letters={letters} onJump={jumpToLetter} />}
        {selectionMode && <BulkActionBar count={selectedIds.size} busy={bulkBusy} onAddToSetlist={() => setShowSetlistPicker(true)} onMoveFolder={bulkMoveFolder} onToggleFav={bulkFavorite} onDelete={bulkDelete} onCancel={exitSelection} />}
        {actionSong && <SongActionSheet song={actionSong} onClose={() => setActionSong(null)} onSaved={refresh} />}

        {showSetlistPicker && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowSetlistPicker(false)}>
            <div className="bg-[#292d36] rounded-3xl w-full max-w-md overflow-hidden pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-bold">Agregar a repertorio</h3>
                <button onClick={() => setShowSetlistPicker(false)} aria-label="Cerrar" className="p-1 text-white/50"><X size={20} /></button>
              </div>
              <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto">
                {sets.length === 0 ? <p className="text-sm text-white/45 px-4 py-8 text-center">No tenés repertorios. Creá uno desde la pestaña Repertorios.</p> : sets.map((s) => (
                  <button key={s.id} onClick={() => bulkAddToSetlist(s.id)} disabled={bulkBusy} className="w-full flex items-center gap-3 px-4 h-14 rounded-xl text-sm hover:bg-white/5 text-left disabled:opacity-50">
                    <span className="w-10 h-10 rounded-lg bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center"><ListMusic size={18} /></span>
                    <div className="flex-1 min-w-0"><div className="font-semibold truncate">{s.name}</div><div className="text-xs text-white/40">{(s.song_ids || []).length} canciones</div></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {params.get('importar') === '1' && <ImportDialog onClose={() => setParams({})} />}
      </div>
    </PullToRefresh>
  );
}