import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { subscribeHero } from '@/lib/hero';
import { HERO_SPRING } from '@/lib/motion';

const PAPER = '#e9e9dd';

export default function HeroLayer() {
  const [h, setH] = useState(null);
  const ref = useRef(null);

  useEffect(() => subscribeHero(setH), []);

  useEffect(() => {
    if (!h || !ref.current) return undefined;
    const el = ref.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    let stopped = false;
    const ctrls = [];
    const run = (target, opts) => { const c = animate(el, target, opts); ctrls.push(c); return c.finished.catch(() => {}); };
    const done = () => { if (!stopped) setH(null); };
    const fade = () => run({ opacity: 0 }, { duration: 0.28, ease: 'easeOut' }).then(done);

    (async () => {
      if (h.mode === 'in') {
        const f = h.from;
        Object.assign(el.style, { left: f.left + 'px', top: f.top + 'px', width: f.width + 'px', height: f.height + 'px', borderRadius: '12px', backgroundColor: PAPER, opacity: 1 });
        await Promise.all([
          run({ left: 0, top: 0, width: vw, height: vh, borderRadius: 0 }, HERO_SPRING),
          run({ backgroundColor: '#000000' }, { duration: 0.35 }),
        ]);
        // Espera a que el visor tenga la partitura lista (máx. 1.5 s) y se desvanece.
        await Promise.race([h.revealed, new Promise((r) => setTimeout(r, 1500))]);
        await new Promise((r) => setTimeout(r, 120));
        await fade();
      } else {
        Object.assign(el.style, { left: '0px', top: '0px', width: vw + 'px', height: vh + 'px', borderRadius: '0px', backgroundColor: '#000000', opacity: 1 });
        // Busca la miniatura de destino (la biblioteca tarda un instante en montarse).
        let target = null;
        for (let i = 0; i < 45 && !stopped && !target; i++) {
          await new Promise((r) => requestAnimationFrame(r));
          const node = document.querySelector(`[data-hero-id="${CSS.escape(h.id)}"]`);
          const r = node?.getBoundingClientRect();
          if (r && r.width && r.bottom > 0 && r.top < vh) target = r;
        }
        if (target) {
          await Promise.all([
            run({ left: target.left, top: target.top, width: target.width, height: target.height, borderRadius: 12 }, HERO_SPRING),
            run({ backgroundColor: PAPER }, { duration: 0.3 }),
          ]);
        }
        await fade();
      }
    })();

    return () => { stopped = true; ctrls.forEach((c) => c.stop?.()); };
  }, [h]);

  if (!h) return null;
  return (
    <div ref={ref} key={h.key} aria-hidden className="fixed z-[300] pointer-events-none overflow-hidden" style={{ left: 0, top: 0, width: 0, height: 0 }}>
      {h.src && <img src={h.src} alt="" className="absolute inset-0 w-full h-full object-contain" />}
    </div>
  );
}
