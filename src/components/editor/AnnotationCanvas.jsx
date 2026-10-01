import React from 'react';

export default function AnnotationCanvas({ items = [], draft = null, rect = null }) {
  const render = (item, i) => {
    const p = item.points || [];
    if (item.tool === 'texto') {
      return (
        <text key={i} x={p[0]?.[0] ?? 0} y={p[0]?.[1] ?? 0} fill={item.color} fontSize={item.size || 32}
          fontWeight={item.style === 'bold' ? 700 : 400} fontStyle={item.style === 'italic' ? 'italic' : 'normal'}
          fontFamily="Inter, sans-serif">{item.text}</text>
      );
    }
    if (!p.length) return null;
    const stroke = item.color || '#dc9050';
    const sw = item.grosor || 4;
    const op = item.opacidad != null ? item.opacidad : (item.tool === 'resaltador' ? 0.4 : 1);
    const common = { stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none', opacity: op };
    if (item.tool === 'forma') {
      const x = Math.min(p[0][0], p.at(-1)[0]), y = Math.min(p[0][1], p.at(-1)[1]);
      const w = Math.abs(p.at(-1)[0] - p[0][0]), h = Math.abs(p.at(-1)[1] - p[0][1]);
      return <rect key={i} x={x} y={y} width={w} height={h} {...common} />;
    }
    if (item.tool === 'flecha') {
      const [x1, y1] = p[0], [x2, y2] = p.at(-1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const ah = 26;
      const ax1 = x2 - ah * Math.cos(ang - Math.PI / 6), ay1 = y2 - ah * Math.sin(ang - Math.PI / 6);
      const ax2 = x2 - ah * Math.cos(ang + Math.PI / 6), ay2 = y2 - ah * Math.sin(ang + Math.PI / 6);
      return (
        <g key={i}>
          <path d={`M ${x1} ${y1} L ${x2} ${y2}`} {...common} />
          <path d={`M ${x2} ${y2} L ${ax1} ${ay1} M ${x2} ${y2} L ${ax2} ${ay2}`} {...common} />
        </g>
      );
    }
    return <polyline key={i} points={p.map((v) => v.join(',')).join(' ')} {...common} />;
  };

  // Si se pasa el rectángulo real de la partitura, el SVG se posiciona exactamente
  // sobre la hoja (no sobre el contenedor entero), manteniendo el viewBox
  // 0 0 1000 1300 con preserveAspectRatio="none" para que las coordenadas
  // (x,y) siempre apunten al mismo lugar de la partitura.
  const style = rect
    ? { position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    : { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  return (
    <svg viewBox="0 0 1000 1300" preserveAspectRatio="none" className="z-10 pointer-events-none" style={style}>
      {items.map(render)}
      {draft && render(draft, 'draft')}
    </svg>
  );
}