import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { supabase } from '@/api/supabaseClient';

// Google Play Billing (solo en la app de Android). En la web se sigue usando Stripe.
// Los IDs tienen que coincidir con la suscripción creada en Play Console.
export const PLAY_PRODUCT_ID = 'atril_premium';
export const PLAY_BASE_PLAN = 'mensual';

export const usesPlayBilling = () => Capacitor.getPlatform() === 'android';

// Precio localizado que muestra Google Play (p. ej. "US$4,99" o "ARS 4.999"). null si no se pudo leer.
export async function getPlayPrice() {
  try {
    const { products } = await NativePurchases.getProducts({ productIdentifiers: [PLAY_PRODUCT_ID], productType: PURCHASE_TYPE.SUBS });
    return products?.[0]?.priceString || null;
  } catch {
    return null;
  }
}

// El servidor verifica la compra con Google, la confirma y activa premium. La app nunca se autoactiva.
async function verifyOnServer(purchaseToken) {
  const { data, error } = await supabase.functions.invoke('verify-play-purchase', { body: { purchaseToken, productId: PLAY_PRODUCT_ID } });
  if (error) {
    let msg = 'No se pudo verificar la compra.';
    try { msg = (await error.context?.json())?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
}

export async function buyPremium(userId) {
  const { isBillingSupported } = await NativePurchases.isBillingSupported();
  if (!isBillingSupported) throw new Error('Google Play no está disponible en este dispositivo.');
  const tx = await NativePurchases.purchaseProduct({
    productIdentifier: PLAY_PRODUCT_ID,
    planIdentifier: PLAY_BASE_PLAN,
    productType: PURCHASE_TYPE.SUBS,
    appAccountToken: userId, // id de Supabase (UUID al azar, no es dato personal): vincula la compra a la cuenta
    autoAcknowledgePurchases: false, // la confirma el servidor después de verificarla
  });
  if (!tx?.purchaseToken) throw new Error('Google Play no devolvió la compra.');
  return verifyOnServer(tx.purchaseToken);
}

// Revisa las suscripciones del usuario en Google Play y las vuelve a verificar
// (sirve para "Restaurar compra" y para registrar las renovaciones mensuales).
export async function syncPremium() {
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
  let last = null;
  for (const p of (purchases || []).filter((x) => x.productIdentifier === PLAY_PRODUCT_ID && x.purchaseToken)) {
    try { last = await verifyOnServer(p.purchaseToken); } catch { /* una compra vieja o vencida no corta el resto */ }
  }
  return last;
}

// Cancelar o cambiar la suscripción se hace en Google Play.
export const manageSubscription = () => NativePurchases.manageSubscriptions();

// Error cuando el usuario cierra la ventana de Google Play sin comprar: no se muestra como error.
export const isUserCancel = (e) => /cancel/i.test(e?.message || '') || e?.code === 'USER_CANCELLED';
