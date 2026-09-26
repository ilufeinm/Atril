import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from "base44:runtime";

async function verifySignature(rawBody: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map(p => p.trim().split("=")));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`));
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

export default async function(req: Request): Promise<Response> {
  try {
    const sig = req.headers.get("stripe-signature") || "";
    const rawBody = await req.text();
    const ok = await verifySignature(rawBody, sig, secrets.get("STRIPE_WEBHOOK_SECRET") || "");
    if (!ok) return Response.json({ error: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(rawBody);
    const base44 = createClientFromRequest(req);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      if (userId) {
        await base44.asServiceRole.entities.User.update(userId, { plan: "premium", stripe_customer_id: customerId });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const customerId = sub.customer;
      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      for (const u of users) {
        await base44.asServiceRole.entities.User.update(u.id, { plan: "free" });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}