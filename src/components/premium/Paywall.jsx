import React from 'react';
import { Mic, AudioLines, StickyNote, Check, Lock } from 'lucide-react';
import BottomSheet from '@/components/motion/BottomSheet';
import { useCheckout } from '@/lib/useCheckout';

// Paywall de Premium. Criterio (PRODUCT.md + revisión del código, 2026-10-12):
//  · Promete solo lo que Premium bloquea de verdad hoy: la grabación de la performance.
//  · Dice qué sigue gratis: el premium comunica valor, no restricción.
//  · Un solo precio real (no hay anual ni prueba): sin descuentos ni contadores inventados.
//  · Se cierra fácil (X arriba y "Ahora no"); nunca aparece en pleno Modo En Vivo.
const BENEFITS = [
  { Icon: AudioLines, title: 'Audio y partitura sincronizados', text: 'Escuchás la grabación con la partitura al lado.' },
  { Icon: StickyNote, title: 'Notas de performance', text: 'Anotá qué ajustar, en el segundo exacto.' },
];

const FREE = ['Biblioteca y Modo En Vivo', 'Repertorios y setlists', 'Bandas y repertorio compartido'];

export default function Paywall({ onClose }) {
  const { busy, startCheckout } = useCheckout();

  return (
    <BottomSheet title="Atril Premium" onClose={onClose} detents={[0.94]}>
      <div className="px-5 pb-2 space-y-6">
        <div className="pt-2">
          <span className="w-14 h-14 rounded-2xl bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center" aria-hidden="true"><Mic size={26} /></span>
          <h2 className="text-2xl font-bold mt-4 leading-tight">Grabá tus shows y ensayos.</h2>
          <p className="text-sm text-white/55 mt-2 leading-relaxed">Escuchate después de tocar, con la partitura sincronizada.</p>
        </div>

        <ul className="space-y-4">
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/5 text-[#c9ef72] flex items-center justify-center shrink-0" aria-hidden="true"><Icon size={18} /></span>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{text}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-white/50 mb-2.5">Sigue gratis, sin límites:</div>
          <ul className="space-y-1.5">
            {FREE.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/75"><Check size={15} className="text-[#c9ef72] shrink-0" aria-hidden="true" /> {f}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#8e9aaf]/60 bg-[#8e9aaf]/10 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Premium mensual</div>
            <div className="text-xs text-white/50 mt-0.5">Se renueva cada mes.</div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums">US$4,99</span>
            <span className="text-xs text-white/50"> / mes</span>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={startCheckout} disabled={busy} className="w-full h-12 rounded-xl bg-[#c9ef72] text-[#172013] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? 'Abriendo el pago…' : 'Continuar con Premium'}
          </button>
          <p className="text-[11px] text-white/40 text-center flex items-center justify-center gap-1.5"><Lock size={12} aria-hidden="true" /> Pagás con tarjeta en una página segura de Stripe.</p>
          <button onClick={onClose} className="w-full h-11 text-white/50 text-sm">Ahora no</button>
        </div>
      </div>
    </BottomSheet>
  );
}
