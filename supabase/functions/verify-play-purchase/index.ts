import { createClient } from "npm:@supabase/supabase-js@2";

// Verifica una suscripción de Google Play con la API de Google (no confía en el celular)
// y, si está vigente, extiende premium_until del usuario. También confirma ("acknowledge")
// la compra: si no se confirma en 3 días, Google la reembolsa.
//
// Secretos necesarios en Supabase (Project Settings → Edge Functions → Secrets):
//   GOOGLE_SERVICE_ACCOUNT_JSON  JSON completo de la cuenta de servicio de Google Cloud
//   PLAY_PACKAGE_NAME            opcional (por defecto com.scorebook.musicapp)
//   PLAY_PRODUCT_ID              opcional (por defecto atril_premium)

const PKG = Deno.env.get("PLAY_PACKAGE_NAME") ?? "com.scorebook.musicapp";
const PRODUCT = Deno.env.get("PLAY_PRODUCT_ID") ?? "atril_premium";
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
// Estados en los que la suscripción da acceso (CANCELED = no renueva, pero sigue vigente hasta expiryTime).
const VALID = new Set(["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Token de acceso OAuth de la cuenta de servicio (JWT firmado con RS256).
async function googleAccessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "{}");
  if (!sa.client_email || !sa.private_key) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error("No se pudo autenticar con Google");
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return json({ error: "Iniciá sesión para continuar." }, 401);

    const { purchaseToken, productId } = await req.json().catch(() => ({}));
    if (typeof purchaseToken !== "string" || !purchaseToken || purchaseToken.length > 1000) return json({ error: "Compra inválida." }, 400);
    if (productId && productId !== PRODUCT) return json({ error: "Producto desconocido." }, 400);

    // Una compra pertenece a un solo usuario: no se puede reutilizar la de otro.
    const { data: owner } = await admin.from("play_purchases").select("user_id").eq("purchase_token", purchaseToken).maybeSingle();
    if (owner && owner.user_id !== user.id) return json({ error: "Esta compra pertenece a otra cuenta." }, 409);

    const access = await googleAccessToken();
    const subRes = await fetch(`${API}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (!subRes.ok) return json({ error: "Google no reconoce esta compra." }, 400);
    const sub = await subRes.json();

    const items = (sub.lineItems ?? []).filter((li: { productId?: string }) => li.productId === PRODUCT);
    if (!items.length) return json({ error: "La compra no corresponde a Atril Premium." }, 400);

    // La app manda el id del usuario como identificador de cuenta al comprar.
    const accountId = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId;
    if (accountId && accountId !== user.id) return json({ error: "Esta compra pertenece a otra cuenta." }, 409);

    const expiry = new Date(Math.max(...items.map((li: { expiryTime?: string }) => Date.parse(li.expiryTime ?? "") || 0)));
    const active = VALID.has(sub.subscriptionState) && expiry.getTime() > Date.now();

    await admin.from("play_purchases").upsert({
      purchase_token: purchaseToken,
      user_id: user.id,
      product_id: PRODUCT,
      state: sub.subscriptionState ?? null,
      expiry_time: expiry.getTime() > 0 ? expiry.toISOString() : null,
      updated_date: new Date().toISOString(),
    });

    if (active) {
      const { error } = await admin.from("profiles").update({ premium_until: expiry.toISOString() }).eq("id", user.id);
      if (error) throw new Error(error.message);
      if (sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
        await fetch(`${API}/purchases/subscriptions/${PRODUCT}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, {
          method: "POST",
          headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
          body: "{}",
        });
      }
    }

    return json({ premium: active, premium_until: active ? expiry.toISOString() : null, state: sub.subscriptionState ?? null });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
