import React, { useState } from 'react';
import { Star, AlertTriangle, XCircle, StickyNote, Plus, Trash2 } from 'lucide-react';

const KINDS = [
  { key: 'excelente', icon: Star, color: 'text-[#c9ef72]', label: 'Excelente' },
  { key: 'revisar', icon: AlertTriangle, color: 'text-amber-400', label: 'Revisar' },
  { key: 'error', icon: XCircle, color: 'text-red-400', label: 'Error' },
  { key: 'nota', icon: StickyNote, color: 'text-sky-400', label: 'Nota' }
];
const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };

export default function PerformanceNotes({ notes, currentTime, onAdd, onRemove, onSeek }) {
  const [kind, setKind] = useState('nota');
  const [text, setText] = useState('');
  const meta = (k) => KINDS.find((c) => c.key === k);
  const add = () => { if (!text.trim()) return; onAdd({ t: currentTime, kind, text: text.trim() }); setText(''); };

  return (
    <div className="bg-[#242831] rounded-2xl p-5">
      <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-3">Notas de performance</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {KINDS.map((c) => { const I = c.icon; return (
          <button key={c.key} onClick={() => setKind(c.key)} className={`flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-xs font-semibold ${kind === c.key ? `${c.color} bg-white/10` : 'text-white/50 bg-white/5'}`}><I size={14} /> {c.label}</button>
        ); })}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={`Nota en ${fmt(currentTime)}…`} className="stage-input flex-1" />
        <button onClick={add} className="w-11 h-11 rounded-xl bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0"><Plus size={18} /></button>
      </div>
      <div className="mt-4 space-y-2">
        {notes.map((n, i) => { const m = meta(n.kind); const I = m.icon; return (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <button onClick={() => onSeek(n.t)} className={`shrink-0 ${m.color}`}><I size={16} /></button>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white/40 tabular-nums">{fmt(n.t)} · {m.label}</div>
              <div className="text-sm text-white/80 mt-0.5">{n.text}</div>
            </div>
            <button onClick={() => onRemove(i)} className="text-white/30 hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
          </div>
        ); })}
        {!notes.length && <p className="text-sm text-white/40 text-center py-3">Aún no hay notas. Marcá momentos clave mientras escuchás.</p>}
      </div>
    </div>
  );
}