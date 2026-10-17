import React, { useState } from 'react';
import { Star, AlertTriangle, XCircle, StickyNote, Plus, Trash2 } from 'lucide-react';
import { tr } from '@/i18n';

const KINDS = [
  { key: 'nota', icon: StickyNote, color: 'text-sky-400', label: tr('Nota') },
  { key: 'excelente', icon: Star, color: 'text-[#c9ef72]', label: tr('Excelente') },
  { key: 'revisar', icon: AlertTriangle, color: 'text-amber-400', label: tr('Revisar') },
  { key: 'error', icon: XCircle, color: 'text-red-400', label: tr('Error') },
];
const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };

export default function PerformanceNotes({ notes, currentTime, onAdd, onRemove, onSeek }) {
  const [kind, setKind] = useState('nota');
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const meta = (k) => KINDS.find((c) => c.key === k);
  const add = () => { if (!text.trim()) return; onAdd({ t: currentTime, kind, text: text.trim() }); setText(''); setFocused(false); };

  return (
    <div className="glass-flat rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          onFocus={() => setFocused(true)}
          placeholder={tr('Agregar nota en {{time}}…', { time: fmt(currentTime) })}
          className="stage-input flex-1 h-11"
        />
        {(focused || text) && (
          <div className="flex items-center gap-0.5">
            {KINDS.map((c) => { const I = c.icon; return (
              <button key={c.key} onClick={() => setKind(c.key)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${kind === c.key ? `${c.color} bg-white/12` : 'text-white/35 hover:text-white/60'}`}><I size={15} /></button>
            );})}
          </div>
        )}
        <button onClick={add} aria-label={tr('Agregar nota')} className="home-cta w-11 h-11 rounded-full flex items-center justify-center shrink-0"><Plus size={18} /></button>
      </div>
      <div className="mt-3 space-y-1">
        {notes.map((n, i) => { const m = meta(n.kind); const I = m.icon; return (
          <div key={i} className="flex items-center gap-3 py-2">
            <button onClick={() => onSeek(n.t)} className={`shrink-0 ${m.color}`}><I size={15} /></button>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/85 truncate">{n.text}</div>
              <div className="text-[11px] text-white/55 tabular-nums">{fmt(n.t)}</div>
            </div>
            <button onClick={() => onRemove(i)} className="text-white/25 hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
          </div>
        );})}
        {!notes.length && <p className="text-sm text-white/60 py-2">{tr('Marcá momentos clave mientras escuchás.')}</p>}
      </div>
    </div>
  );
}