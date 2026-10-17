import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { tr } from '@/i18n';

// Inicia el pago de Premium (Stripe, vía la función createCheckout).
// Extraído de UpgradeCard para que lo usen la tarjeta y la paywall.
// Nota: en la app de Android, Google Play exige su propio sistema de cobro para suscripciones digitales.
export function useCheckout() {
  const [busy, setBusy] = useState(false);

  const startCheckout = async () => {
    setBusy(true);
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setBusy(false);
      alert(tr('Permití las ventanas emergentes para continuar con el pago.'));
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;
    try {
      const res = await base44.functions.invoke('createCheckout', { origin: window.location.origin });
      if (res.data?.url) {
        if (checkoutTab) checkoutTab.location.replace(res.data.url);
        else window.location.assign(res.data.url);
      } else {
        checkoutTab?.close();
        alert(res.data?.error || tr('No se pudo iniciar el pago.'));
      }
    } catch (e) {
      checkoutTab?.close();
      alert(e.response?.data?.error || tr('No se pudo iniciar el pago.'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, startCheckout };
}
