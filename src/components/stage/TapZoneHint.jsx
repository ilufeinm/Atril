import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SEEN_KEY = 'atril-tapzones-seen';
const readSeen = () => { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; } };

// Muestra una sola vez (por dispositivo) dónde tocar para pasar de página en el Modo En Vivo.
// Coincide con handleScreenTap: tercio izquierdo = anterior, el resto = siguiente.
// No bloquea toques (pointer-events-none) y se va sola, o con el primer toque.
export default function TapZoneHint({ dismissed }) {
  const [show, setShow] = useState(() => !readSeen());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* sin almacenamiento: se vuelve a mostrar la próxima vez */ }
    const t1 = setTimeout(() => setVisible(true), 400);
    const t2 = setTimeout(() => setVisible(false), 3600);
    const t3 = setTimeout(() => setShow(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show]);

  useEffect(() => { if (dismissed) setVisible(false); }, [dismissed]);

  if (!show) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-10 flex transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-1/3 h-full flex items-center justify-center bg-gradient-to-r from-black/45 to-black/15 border-r border-white/15">
        <span className="flex flex-col items-center gap-2 text-white/90 text-sm font-semibold"><ChevronLeft size={28} /> Anterior</span>
      </div>
      <div className="flex-1 h-full flex items-center justify-center bg-gradient-to-l from-black/45 to-black/15">
        <span className="flex flex-col items-center gap-2 text-white/90 text-sm font-semibold"><ChevronRight size={28} /> Siguiente</span>
      </div>
    </div>
  );
}
