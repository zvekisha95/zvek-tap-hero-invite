export default async (req) => {
  try {
    const body = await req.json();
    const email = (body.email || "").trim();

    // Gmail check
    if (!email.endsWith("@gmail.com")) {
      return new Response(
        JSON.stringify({ error: "Gmail only" }),
        { status: 400 }
      );
    }

    // Rate-limit (anti-spam)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    globalThis.rateLimit = globalThis.rateLimit || {};
    const now = Date.now();

    if (!globalThis.rateLimit[ip]) {
      globalThis.rateLimit[ip] = [];
    }
    
    // Clean old timestamps (1 hour)
    globalThis.rateLimit[ip] = globalThis.rateLimit[ip].filter(
      t => now - t < 3600000
    );

    if (globalThis.rateLimit[ip].length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Try again." }),
        { status: 429 }
      );
    }

    globalThis.rateLimit[ip].push(now);

    // Invite log
    globalThis.inviteLog = globalThis.inviteLog || [];
    globalThis.inviteLog.push({
      email,
      ip,
      time: new Date().toISOString()
    });

    // SEND EMAIL
    const apiKey = process.env.RESEND_API_KEY;
    const testerLink = process.env.TEST_LINK;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <onboarding@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Tester Invite",
        html: `<p>Welcome tester!</p><p>Your link:</p><a href="${testerLink}">${testerLink}</a>`
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
