import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export default function MobileSelect({ value, onChange, options, label, className = 'w-32' }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`stage-input ${className} flex items-center justify-between gap-1 select-none`}
      >
        <span className="truncate text-left">
          {current ? `${current.emoji ? current.emoji + ' ' : ''}${current.label}` : 'Seleccionar'}
        </span>
        <ChevronDown size={15} className="text-white/40 shrink-0" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#292d36] rounded-3xl w-full max-w-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-base font-bold">{label || 'Seleccionar'}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-white/50"><X size={18} /></button>
            </div>
            <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto overscroll-y-contain">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 h-12 rounded-xl text-sm select-none ${o.value === value ? 'bg-[#c9ef72]/15 text-[#c9ef72]' : 'hover:bg-white/5'}`}
                >
                  {o.emoji && <span>{o.emoji}</span>}
                  <span className="flex-1 text-left">{o.label}</span>
                  {o.value === value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}