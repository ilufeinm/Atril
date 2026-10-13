import React, { useEffect, useState } from 'react';
import { Mic, AudioLines, StickyNote, Check, Lock } from 'lucide-react';
import BottomSheet from '@/components/motion/BottomSheet';
import { useCheckout } from '@/lib/useCheckout';
import { useAuth } from '@/lib/AuthContext';
import { usesPlayBilling, getPlayPrice, buyPremium, syncPremium, isUserCancel } from '@/lib/billing';

// Paywall de Premium. Criterio (PRODUCT.md + revisión del código, 2026-10-12):
//  · Promete solo lo que Premium bloquea de verdad hoy: la grabación de la performance.
//  · Dice qué sigue gratis: el premium comunica valor, no restricción.
//  · Un solo precio real (no hay anual ni prueba): sin descuentos ni contadores inventados.
//  · Se cierra fácil (X arriba y "Ahora no"); nunca aparece en pleno Modo En Vivo.
const BENEFITS = [
  { Icon: AudioLines, title: 'Audio y partitura sincronizados', text: 'Escuchás la grabación con la partitura al lado.' },
  { Icon: StickyNote, title: 'Notas de performance', text: 'Anotá qué ajustar, en el segundo exacto.' },
];

const FREE = ['Partituras y Modo En Vivo', 'Repertorios y setlists', 'Bandas y repertorio compartido'];

export default function Paywall({ onClose }) {
  const { busy: stripeBusy, startCheckout } = useCheckout();
  const { user, checkUserAuth } = useAuth();
  // En la app de Android Google Play exige su propio cobro; en la web se usa Stripe.
  const play = usesPlayBilling();
  const [price, setPrice] = useState('US$4,99');
  const [playBusy, setPlayBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const busy = stripeBusy || playBusy;

  useEffect(() => { if (play) getPlayPrice().then((p) => p && setPrice(p)); }, [play]);

  const afterPlay = async (res, okText) => {
    if (res?.premium) { await checkUserAuth?.(); onClose(); }
    else setMsg(okText);
  };
  const subscribe = async () => {
    if (!play) return startCheckout();
    setMsg(''); setPlayBusy(true);
    try { await afterPlay(await buyPremium(user?.id), 'La compra no quedó activa. Si se cobró, tocá "Restaurar compra".'); }
    catch (e) { if (!isUserCancel(e)) setMsg(e.message || 'No se pudo completar la compra.'); }
    finally { setPlayBusy(false); }
  };
  const restore = async () => {
    setMsg(''); setPlayBusy(true);
    try { await afterPlay(await syncPremium(), 'No encontramos una suscripción activa en tu cuenta de Google Play.'); }
    catch (e) { setMsg(e.message || 'No se pudo restaurar la compra.'); }
    finally { setPlayBusy(false); }
  };

  return (
    <BottomSheet title="Atril Premium" onClose={onClose} detents={[0.94]}>
      <div className="px-5 pb-2 space-y-6">
        <div className="pt-2">
          <span className="w-14 h-14 rounded-full bg-[#c9ef72]/15 text-[#c9ef72] flex items-center justify-center" aria-hidden="true"><Mic size={26} /></span>
          <h2 className="font-display text-[26px] font-extrabold tracking-tight mt-4 leading-tight">Grabá tus shows y ensayos.</h2>
          <p className="text-sm text-white/70 mt-2 leading-relaxed">Escuchate después de tocar, con la partitura sincronizada.</p>
        </div>

        <ul className="space-y-4">
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="w-9 h-9 rounded-full bg-white/[.07] text-[#c9ef72] flex items-center justify-center shrink-0" aria-hidden="true"><Icon size={18} /></span>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-white/70 mt-0.5 leading-relaxed">{text}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="glass-flat rounded-3xl p-4">
          <div className="text-xs text-white/70 mb-2.5">Sigue gratis, sin límites:</div>
          <ul className="space-y-1.5">
            {FREE.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/75"><Check size={15} className="text-[#c9ef72] shrink-0" aria-hidden="true" /> {f}</li>
            ))}
          </ul>
        </div>

        <div className="glass-ticket rounded-3xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Premium mensual</div>
            <div className="text-xs text-white/70 mt-0.5">Se renueva cada mes.</div>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-extrabold tabular-nums">{price}</span>
            <span className="text-xs text-white/70"> / mes</span>
          </div>
        </div>

        <div className="space-y-2">
          {msg && <p role="alert" className="text-xs text-red-300 text-center">{msg}</p>}
          <button onClick={subscribe} disabled={busy} className="home-cta w-full h-12 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? (play ? 'Procesando…' : 'Abriendo el pago…') : (play ? 'Suscribirme con Google Play' : 'Continuar con Premium')}
          </button>
          {play ? (
            <>
              <p className="text-[11px] text-white/60 text-center leading-relaxed">Se cobra en tu cuenta de Google Play. Cancelás cuando quieras desde Google Play.</p>
              <button onClick={restore} disabled={busy} className="w-full h-10 text-white/80 underline-offset-2 hover:underline text-sm font-semibold">Restaurar compra</button>
            </>
          ) : (
            <p className="text-[11px] text-white/60 text-center flex items-center justify-center gap-1.5"><Lock size={12} aria-hidden="true" /> Pagás con tarjeta en una página segura de Stripe.</p>
          )}
          <button onClick={onClose} className="w-full h-11 text-white/70 text-sm font-semibold">Ahora no</button>
        </div>
      </div>
    </BottomSheet>
  );
}
