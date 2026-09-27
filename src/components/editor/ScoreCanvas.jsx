import React, { useRef, useState } from 'react';
import ScorePreview from '@/components/stage/ScorePreview';
import AnnotationCanvas from './AnnotationCanvas';
import MarkerLayer from './MarkerLayer';
import { isDrawingTool } from './editorTools';

const ZOOM_MIN = 1, ZOOM_MAX = 4;

export default function ScoreCanvas({ song, page, maxPage, onPageChange, zoom, onZoomChange, tool, options, items, onAdd, onEraseAt, onTextAt, onMoveMarker, onDeleteMarker }) {
  const innerRef = useRef(null);
  const pointers = useRef(new Map());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draft, setDraft] = useState(null);
  const pinch = useRef(null);
  const draw = useRef(null);

  const pageItems = items.filter((x) => !x.page || x.page === page);
  const markers = pageItems.filter((x) => x.tool === 'marcador');
  const annos = pageItems.filter((x) => x.tool !== 'marcador');

  const toCoords = (e) => {
    const r = innerRef.current.getBoundingClientRect();
    return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1300)];
  };

  const onDown = (e) => {
    try { innerRef.current.setPointerCapture?.(e.pointerId); } catch {}
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      if (tool === 'borrador') { const [x, y] = toCoords(e); onEraseAt(x, y); }
      else if (tool === 'texto') { const [x, y] = toCoords(e); onTextAt(x, y); }
      else if (tool === 'marcador') { const [x, y] = toCoords(e); onAdd({ tool: 'marcador', points: [[x, y]], label: options.label, color: options.color }); }
      else if (isDrawingTool(tool)) {
        const [x, y] = toCoords(e);
        draw.current = { tool, points: [[x, y]], color: options.color, grosor: options.grosor, opacidad: options.opacidad };
        setDraft({ ...draw.current });
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const startMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      pinch.current = { dist: d, startMid, lastMid: startMid, lastDist: d, zoom, pan0: { ...pan } };
      draw.current = null; setDraft(null);
    }
  };

  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ratio = dist / pinch.current.dist;
      onZoomChange(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(pinch.current.zoom * ratio).toFixed(2))));
      setPan({ x: pinch.current.pan0.x + (mid.x - pinch.current.startMid.x), y: pinch.current.pan0.y + (mid.y - pinch.current.startMid.y) });
      pinch.current.lastMid = mid; pinch.current.lastDist = dist;
    } else if (pointers.current.size === 1 && draw.current) {
      const [x, y] = toCoords(e);
      draw.current = { ...draw.current, points: [...draw.current.points, [x, y]] };
      setDraft({ ...draw.current });
    }
  };

  const onUp = (e) => {
    const wasTwo = pointers.current.size === 2;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      if (wasTwo && pinch.current && pinch.current.zoom <= 1.05) {
        const dx = pinch.current.lastMid.x - pinch.current.startMid.x;
        const dy = pinch.current.lastMid.y - pinch.current.startMid.y;
        const ratio = pinch.current.lastDist / pinch.current.dist;
        if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(ratio - 1) < 0.15) {
          onPageChange(dx < 0 ? Math.min(maxPage, page + 1) : Math.max(1, page - 1));
        }
      }
      pinch.current = null;
    }
    if (pointers.current.size === 0 && draw.current) {
      let d = draw.current;
      if (d.points.length === 1) d = { ...d, points: [d.points[0], [d.points[0][0] + 3, d.points[0][1] + 3]] };
      onAdd(d);
      draw.current = null; setDraft(null);
    }
  };

  const effPan = zoom <= 1 ? { x: 0, y: 0 } : pan;
  const transform = `translate(${effPan.x}px, ${effPan.y}px) scale(${zoom})`;

  return (
    <div className="absolute inset-0 overflow-hidden flex justify-center"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 56px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}>
      <div ref={innerRef} className="w-full max-w-[820px] h-full relative"
        style={{ transform, transformOrigin: 'center center', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <ScorePreview song={song} page={page} fill />
        <AnnotationCanvas items={annos} draft={draft} />
        <MarkerLayer markers={markers} innerRef={innerRef} onMove={onMoveMarker} onDelete={onDeleteMarker} />
      </div>
    </div>
  );
}