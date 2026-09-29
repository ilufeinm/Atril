import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from "base44:runtime";

const PRICE_ID = "price_1UJyvn2corvykLLBIVx2jWXZ";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Debes iniciar sesión para suscribirte' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const origin = body.origin || req.headers.get("origin") || "https://imaginary-stage-book-pro.base44.app";
    const appId = secrets.get("BASE44_APP_ID") || "";

    // Usar siempre el usuario autenticado; ignorar cualquier user_id del cliente
    const userId = user.id;
    const email = user.email;

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", PRICE_ID);
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[base44_app_id]", appId);
    params.append("subscription_data[metadata][base44_app_id]", appId);
    if (email) params.append("customer_email", String(email));
    params.append("client_reference_id", String(userId));
    params.append("success_url", `${origin}/perfil?upgraded=1`);
    params.append("cancel_url", `${origin}/perfil?upgrade=cancelled`);
    params.append("allow_promotion_codes", "true");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`,
        "Stripe-Version": "2025-10-29.clover",
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": crypto.randomUUID()
      },
      body: params
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || "Stripe error" }, { status: 400 });
    return Response.json({ url: data.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}