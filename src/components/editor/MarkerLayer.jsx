import React, { useRef } from 'react';

export default function MarkerLayer({ markers = [], innerRef, onMove, onDelete, readOnly = false }) {
  const drag = useRef(null);

  const down = (e, i) => {
    if (readOnly) return;
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    const rect = innerRef.current.getBoundingClientRect();
    drag.current = { i, rect, sx: e.clientX, sy: e.clientY, orig: markers[i].points[0] };
  };
  const move = (e) => {
    if (readOnly || !drag.current) return;
    e.stopPropagation();
    const { rect, i, sx, sy, orig } = drag.current;
    const nx = orig[0] + (e.clientX - sx) / rect.width * 1000;
    const ny = orig[1] + (e.clientY - sy) / rect.height * 1300;
    onMove(i, Math.max(20, Math.min(980, Math.round(nx))), Math.max(20, Math.min(1280, Math.round(ny))));
  };
  const up = (e) => { if (readOnly) return; e.stopPropagation(); drag.current = null; };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {markers.map((m, i) => {
        const [x, y] = m.points[0];
        return (
          <div key={i} className="absolute" style={{ left: `${x / 10}%`, top: `${y / 13}%`, transform: 'translate(-50%,-50%)' }}>
            <div
              onPointerDown={(e) => down(e, i)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
              className={`flex items-center gap-1.5 rounded-full pl-2.5 pr-1 h-7 text-white text-[11px] font-bold whitespace-nowrap select-none ${readOnly ? 'pointer-events-none' : 'pointer-events-auto'}`}
              style={{ background: 'rgba(10,10,12,.78)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.16)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color || '#8e9aaf' }} />
              <span>{m.label}</span>
              {!readOnly && <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(i)} className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-[12px] leading-none -mr-0.5">×</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}