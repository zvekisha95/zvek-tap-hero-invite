export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  try {
    const { email, trap } = await req.json();

    // Honeypot
    if (trap) {
      return new Response(JSON.stringify({ ok: false, error: "Bot blocked" }), { status: 400 });
    }

    // Gmail only
    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ ok: false, error: "Gmail only" }), { status: 400 });
    }

    // RATE LIMIT – 1 request / 30 sec
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    globalThis.limits = globalThis.limits || {};
    const now = Date.now();

    if (globalThis.limits[ip] && now - globalThis.limits[ip] < 30000) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Too many requests. Try again."
      }), { status: 429 });
    }

    globalThis.limits[ip] = now;

    // LOG STORAGE
    globalThis.inviteLog = globalThis.inviteLog || [];
    globalThis.inviteLog.push({ email, time: new Date().toISOString(), ip });

    // ENV VARS
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const link = Deno.env.get("TEST_LINK");

    // SEND EMAIL
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <onboarding@resend.dev>",
        to: email,
        subject: "Your Zvek Tap Hero Access Link",
        html: `
          <h1 style="color:#ff8f1f; font-family:Arial; margin-bottom:12px;">
            🔥 Welcome to the Zvek Tap Hero Testing Program
          </h1>

          <p style="font-size:16px; font-family:Arial; color:#222;">
            You've been selected to join the <b>official tester squad</b> for Zvek Tap Hero.
          </p>

          <p style="font-size:15px; font-family:Arial;">
            ✅ <b>Step 1 — Join the Official Tester Group:</b><br>
            <a href="https://groups.google.com/g/zvektaphero-testers" style="font-size:16px; color:#ff8f1f;">
              https://groups.google.com/g/zvektaphero-testers
            </a>
          </p>

          <p style="font-size:15px; font-family:Arial;">
            ✅ <b>Step 2 — Download the Game:</b><br>
            <a href="${link}" style="font-size:16px; color:#ff8f1f;">
              ${link}
            </a>
          </p>

          <p style="margin-top:20px; font-size:15px; font-family:Arial;">
            If the Play Store link opens blank, open it from your phone while logged into the Gmail you entered.
          </p>

          <p style="margin-top:25px; font-size:15px; font-family:Arial;">
            Good luck in the Sky Trial.<br>
            <b>Zvekisha Dev Team ⚔️</b>
          </p>
        `
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
}
