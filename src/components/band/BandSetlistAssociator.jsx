import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Music2, Plus, Check } from 'lucide-react';

// Modal para asociar repertorios existentes del usuario a una banda.
// No crea copias: la asociación se hace sobre el Setlist existente (band_id).
export default function BandSetlistAssociator({ available, userSetCount, onClose, onAssociate, busy }) {
  const nav = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  const shell = (children) => (
    <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-md space-y-5">{children}</div>
    </div>
  );

  // 3. Usuario sin ningún repertorio → invitar a crear en la página general
  if (userSetCount === 0) {
    return shell(
      <>
        <div className="flex justify-between"><h2 className="text-xl font-bold">Agregar repertorio</h2><button onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <div className="text-center py-6">
          <span className="w-16 h-16 rounded-2xl bg-[#c9ef72]/10 text-[#c9ef72] flex items-center justify-center mx-auto mb-5"><Music2 size={28} /></span>
          <p className="font-semibold text-lg">Todavía no tenés ningún repertorio</p>
          <p className="text-sm text-white/45 mt-2">Creá tu primer repertorio para agregarlo a esta banda.</p>
        </div>
        <button onClick={() => nav('/repertorios?nuevo=1')} className="w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center justify-center gap-2"><Plus size={18} /> Crear repertorio</button>
      </>
    );
  }

  // Usuario con repertorios pero todos ya asociados
  if (available.length === 0) {
    return shell(
      <>
        <div className="flex justify-between"><h2 className="text-xl font-bold">Agregar repertorio</h2><button onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <div className="text-center py-6">
          <span className="w-14 h-14 rounded-2xl bg-white/5 text-white/50 flex items-center justify-center mx-auto mb-4"><Music2 size={26} /></span>
          <p className="text-sm text-white/55">Todos tus repertorios ya están asociados a esta banda.</p>
          <p className="text-xs text-white/35 mt-2">Creá un repertorio nuevo para agregarlo.</p>
        </div>
        <button onClick={() => nav('/repertorios?nuevo=1')} className="w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center justify-center gap-2"><Plus size={18} /> Crear repertorio</button>
        <button onClick={onClose} className="w-full text-white/40 text-sm">Cerrar</button>
      </>
    );
  }

  // 2. Selector con todos los repertorios disponibles (multi-selección)
  return (
    <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-md space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between shrink-0"><h2 className="text-xl font-bold">Agregar repertorio</h2><button onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <p className="text-sm text-white/45 shrink-0">Seleccioná uno o más repertorios para asociar a la banda. Se mantienen sincronizados con tu biblioteca.</p>
        <div className="space-y-2 overflow-y-auto -mx-1 px-1">
          {available.map((s) => {
            const on = selected.has(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${on ? 'bg-[#c9ef72]/15 border-[#c9ef72]/40' : 'bg-[#242831] border-white/[.06] hover:bg-[#2e333c]'}`}>
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-[#c9ef72] border-[#c9ef72] text-[#172013]' : 'border-white/25'}`}>{on && <Check size={14} />}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className="text-xs text-white/40">{(s.song_ids || []).length} canciones</div>
                </div>
              </button>
            );
          })}
        </div>
        <button disabled={selected.size === 0 || busy} onClick={() => onAssociate([...selected])} className="w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">{busy ? 'Agregando…' : `Agregar a la banda${selected.size > 0 ? ` (${selected.size})` : ''}`}</button>
      </div>
    </div>
  );
}