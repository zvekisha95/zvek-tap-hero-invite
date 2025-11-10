// /api/send-invite.js

export default async function handler(req) {
  // Always respond quickly
  try {
    const { email, trap } = await req.json();

    // Honeypot (bots fill hidden field)
    if (trap) {
      return new Response(JSON.stringify({ ok: false, error: "Bot blocked" }), { status: 400 });
    }

    // Gmail only
    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ ok: false, error: "Gmail only" }), { status: 400 });
    }

    // RATE LIMIT (only 1 request per IP / 30 sec)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    globalThis.limits = globalThis.limits || {};
    const now = Date.now();

    if (globalThis.limits[ip] && now - globalThis.limits[ip] < 30000) {
      return new Response(JSON.stringify({ ok: false, error: "Too many requests. Try again." }), { status: 429 });
    }

    globalThis.limits[ip] = now;

    // Prepare log storage
    globalThis.inviteLog = globalThis.inviteLog || [];
    globalThis.inviteLog.push({ email, time: new Date().toISOString(), ip });

    // Send email through RESEND
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const link = Deno.env.get("TEST_LINK");

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <invite@zvekisha.dev>",
        to: email,
        subject: "Your Zvek Tap Hero Access Link",
        html: `<h1>Zvek Access Granted</h1><p>Your link:</p><a href="${link}">${link}</a>`
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
