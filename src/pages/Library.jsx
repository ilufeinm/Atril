import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronDown, List, LayoutGrid, CheckSquare, ListMusic, Check, FileMusic, SearchX, CloudOff, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStage } from '@/components/stage/StageProvider';
import SongRow, { SongTableHeader } from '@/components/stage/SongRow';
import { Chip, Segmented, StatusState, btnPrimary, btnSecondary } from '@/components/glass/parts';
import { useOfflineIds } from '@/lib/offlineScores';
import SongCard from '@/components/stage/SongCard';
import AlphabetBar from '@/components/stage/AlphabetBar';
import SongActionSheet from '@/components/stage/SongActionSheet';
import { AnimatePresence } from 'framer-motion';
import BottomSheet from '@/components/motion/BottomSheet';
import LargeTitle from '@/components/stage/LargeTitle';
import { useToast } from '@/components/ui/use-toast';
import BulkActionBar from '@/components/stage/BulkActionBar';
import ImportDialog from '@/components/stage/ImportDialog';
import PullToRefresh from '@/components/stage/PullToRefresh';
import { ListSkeleton } from '@/components/stage/Skeletons';
import { tr } from '@/i18n';

const SORTS = [['recientes', tr('Recientes')], ['titulo', tr('Título')], ['artista', tr('Artista')], ['bpm', 'BPM']];

export default function Library({ favoritesOnly = false }) {
  const { songs, sets, demoHidden, loading, error, refresh, loadSets, saveSong } = useStage();
  const { toast } = useToast();
  const offlineIds = useOfflineIds(songs);
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
  // Lista o grilla: se recuerda en el teléfono.
  const [viewMode, setViewMode] = useState(() => { try { return localStorage.getItem('stage-library-view') || 'list'; } catch { return 'list'; } });
  const chooseView = (v) => { setViewMode(v); try { localStorage.setItem('stage-library-view', v); } catch { /* sin almacenamiento */ } };
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
  let visible = sortFn(songs.filter((s) => matchFilters(s) && matchSearch(s) && (!demoHidden || !s.is_demo)));
  const displayed = visible.slice(0, displayCount);
  const offlineCount = visible.filter((s) => offlineIds.has(s.id)).length;
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

  const newFolder = () => { const name = window.prompt(tr('Nombre de la nueva carpeta')); if (name && name.trim()) { const list = [...new Set([...customFolders, name.trim()])]; localStorage.setItem('stage-folders', JSON.stringify(list)); setFilter(name.trim()); setFolderTick((t) => t + 1); } };
  const sortLabel = SORTS.find(([v]) => v === sort)?.[1] || tr('Recientes');

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
    const folder = window.prompt(tr('Mover a la carpeta (escribí el nombre)'));
    if (!folder) return;
    setBulkBusy(true);
    try { await base44.entities.Song.bulkUpdate([...selectedIds].map((id) => ({ id, folder: folder.trim() }))); await refresh(); exitSelection(); } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
  };
  const bulkDelete = async () => {
    if (!window.confirm(tr('¿Eliminar {{n}} partituras? Esta acción no se puede deshacer.', { n: selectedIds.size }))) return;
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

  // Acciones por deslizamiento (derecha = favorita, izquierda = eliminar). No aplican a las demos.
  const swipeFavorite = async (s) => {
    try {
      await saveSong({ favorite: !s.favorite }, s.id);
      toast({ title: s.favorite ? tr('Quitada de favoritos') : tr('Agregada a favoritos'), description: s.title, variant: 'success' });
    } catch (e) { toast({ title: tr('No se pudo actualizar'), description: e.message, variant: 'destructive' }); }
  };
  const swipeDelete = async (s) => {
    if (!window.confirm(tr('¿Eliminar "{{title}}"? Esta acción no se puede deshacer.', { title: s.title }))) return;
    try { await base44.entities.Song.delete(s.id); await refresh(); }
    catch (e) { toast({ title: tr('No se pudo eliminar'), description: e.message, variant: 'destructive' }); }
  };

  const renderSong = (s, i) => (
    <SongRow key={s.id} index={i} song={s} onSwipeFavorite={s.is_demo ? undefined : swipeFavorite} onSwipeDelete={s.is_demo ? undefined : swipeDelete} query={search} selectionMode={selectionMode} selected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onLongPress={setActionSong} offline={offlineIds.has(s.id)} />
  );

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <LargeTitle className="font-display text-[28px] sm:text-[32px] font-bold tracking-tight leading-none">{favoritesOnly ? tr('Favoritos') : tr('Partituras')}</LargeTitle>
            {/* v3: el conteo y cuántas están listas sin conexión, en vez de un eslogan. */}
            <p className="text-white/60 text-[13px] mt-2 tabular-nums">
              {visible.length} {visible.length === 1 ? tr('partitura') : tr('partituras')}
              {offlineCount > 0 && tr(' · {{n}} disponibles sin conexión', { n: offlineCount })}
            </p>
          </div>
          <button onClick={() => setParams({ importar: '1' })} className={`${btnPrimary} shrink-0`}><Plus size={17} aria-hidden="true" /> <span className="hidden sm:inline">{tr('Importar partitura')}</span><span className="sm:hidden">{tr('Importar')}</span></button>
        </div>
        <label className="relative block"><Search size={17} className="absolute z-[1] pointer-events-none left-3.5 top-1/2 -translate-y-1/2 text-white/60" /><input aria-label={tr('Buscar partituras')} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('Título, autor, tonalidad o etiqueta')} className="seg-track w-full h-11 rounded-[12px] pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#8F98E3] focus:shadow-[0_0_0_3px_rgba(143,152,227,0.2)]" /></label>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Chip active={!filter} onClick={() => setFilter('')}>{tr('Todas')}</Chip>
          <Chip active={filter === 'favoritos'} onClick={() => setFilter(filter === 'favoritos' ? '' : 'favoritos')}><Star size={12} fill="currentColor" aria-hidden="true" /> {tr('Favoritas')}</Chip>
          {folders.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(filter === f ? '' : f)}>{f}</Chip>)}
          <button onClick={newFolder} aria-label={tr('Nueva carpeta')} className="chip-off shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-white/70 hover:text-white border-dashed"><Plus size={16} /></button>
        </div>
        <div className="flex items-center justify-between gap-2 -mt-1">
          <div className="relative">
            <button onClick={() => setSortOpen((o) => !o)} aria-expanded={sortOpen} className="press-none h-11 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/75 hover:text-white">{tr('Ordenar:')}{' '}<span className="text-white font-semibold">{sortLabel}</span> <ChevronDown size={14} aria-hidden="true" /></button>
            {sortOpen && (<><button onClick={() => setSortOpen(false)} className="fixed inset-0 z-10" aria-label={tr('Cerrar orden')} /><div className="absolute left-0 top-11 z-20 w-44 rounded-xl bg-[#1B1B1F] border border-white/10 p-1 shadow-xl">{SORTS.map(([v, l]) => <button key={v} onClick={() => { setSort(v); setSortOpen(false); }} className={`flex w-full items-center justify-between px-3 h-10 rounded-[8px] text-[13px] ${sort === v ? 'text-white font-semibold' : 'text-white/70 hover:text-white'}`}>{l}{sort === v && <Check size={14} aria-hidden="true" />}</button>)}</div></>)}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { if (selectionMode) exitSelection(); else setSelectionMode(true); }} aria-label={selectionMode ? tr('Hecho') : tr('Seleccionar')} className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] text-[13px] transition-colors shrink-0 ${selectionMode ? 'chip-on font-semibold' : 'chip-off font-medium text-white/75 hover:text-white'}`}><CheckSquare size={14} aria-hidden="true" /> <span className="hidden sm:inline">{selectionMode ? tr('Hecho') : tr('Seleccionar')}</span></button>
            <Segmented size="sm" label={tr('Vista')} value={viewMode} onChange={chooseView} options={[['grid', tr('Vista de grilla'), LayoutGrid], ['list', tr('Vista de lista'), List]]} />
          </div>
        </div>
        {loading ? <ListSkeleton count={8} /> : error ? <StatusState tone="error" icon={CloudOff} title={tr('No pudimos cargar tus partituras')} text={tr('Revisá tu conexión y volvé a intentar. Tus partituras siguen guardadas.')} actions={<button type="button" onClick={refresh} className={btnPrimary}><RotateCw size={16} aria-hidden="true" /> {tr('Reintentar')}</button>} /> : visible.length ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-[18px]">
              {displayed.map((s, i) => <SongCard key={s.id} index={i} song={s} query={search} selectionMode={selectionMode} selected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onLongPress={setActionSong} offline={offlineIds.has(s.id)} />)}
            </div>
          ) : showAZ ? (
            <div className={`relative ${selectionMode ? '' : 'pr-4'}`}>
              <SongTableHeader />
              {letters.map((letter) => (
                <div key={letter} ref={(el) => { if (el) groupRefs.current[letter] = el; }} className="scroll-mt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)]">
                  <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 bg-[#111113]/95 backdrop-blur-sm pt-2.5 pb-1 text-[11px] font-bold tracking-[.08em] text-white/50">{letter}</div>
                  <div>{grouped[letter].map(renderSong)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div><SongTableHeader />{displayed.map(renderSong)}</div>
          )
        ) : (songs.length ? (
          <StatusState icon={SearchX} title={tr('Nada coincide')} text={tr('No hay partituras que coincidan con tu búsqueda.')} actions={<button type="button" onClick={() => { setSearch(''); setFilter(''); }} className={btnSecondary}>{tr('Ver todas')}</button>} />
        ) : (
          <StatusState icon={FileMusic} title={tr('Sin partituras todavía')} text={tr('Escaneá o subí un PDF. Cada partitura queda disponible sin conexión.')} actions={<button type="button" onClick={() => setParams({ importar: '1' })} className={btnPrimary}><Plus size={16} aria-hidden="true" /> {tr('Importar partitura')}</button>} />
        ))}

        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-6 text-white/40 text-sm">
            <span className="w-4 h-4 border-2 border-white/20 border-t-[#8e9aaf] rounded-full animate-spin" />
            {tr('Cargando más partituras…')}
          </div>
        )}

        {showAZ && <AlphabetBar letters={letters} onJump={jumpToLetter} />}
        {selectionMode && <BulkActionBar count={selectedIds.size} busy={bulkBusy} onAddToSetlist={() => setShowSetlistPicker(true)} onMoveFolder={bulkMoveFolder} onToggleFav={bulkFavorite} onDelete={bulkDelete} onCancel={exitSelection} />}
        <AnimatePresence>
          {actionSong && <SongActionSheet key="action-sheet" song={actionSong} onClose={() => setActionSong(null)} onSaved={refresh} />}
        </AnimatePresence>

        {showSetlistPicker && (
          <BottomSheet title={tr('Agregar a repertorio')} onClose={() => setShowSetlistPicker(false)} detents={[0.55, 0.94]}>
            <div className="px-2 pb-4">
              {sets.length === 0 ? <p className="text-sm text-white/45 px-4 py-8 text-center">{tr('No tenés repertorios. Creá uno desde la pestaña Repertorios.')}</p> : sets.map((s) => (
                <button key={s.id} onClick={() => bulkAddToSetlist(s.id)} disabled={bulkBusy} className="w-full flex items-center gap-3 px-4 h-14 rounded-xl text-sm hover:bg-white/5 text-left disabled:opacity-50">
                  <span className="w-10 h-10 rounded-lg bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center"><ListMusic size={18} /></span>
                  <div className="flex-1 min-w-0"><div className="font-semibold truncate">{s.name}</div><div className="text-xs text-white/40">{(s.song_ids || []).length} {tr('canciones')}</div></div>
                </button>
              ))}
            </div>
          </BottomSheet>
        )}

        {params.get('importar') === '1' && <ImportDialog onClose={() => setParams({})} />}
      </div>
    </PullToRefresh>
  );
}