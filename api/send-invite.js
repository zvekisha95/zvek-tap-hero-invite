export default async (request) => {
  try {
    const ip = request.headers.get("x-forwarded-for") || "0.0.0.0";
    const { email } = await request.json();

    // Anti-bot: invalid gmail patterns
    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Gmail only." }), { status: 400 });
    }

    // HARD domain block
    if (!email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
      return new Response(JSON.stringify({ error: "Invalid Gmail." }), { status: 400 });
    }

    // RATE LIMIT — max 1 request per IP per minute
    globalThis.ipHits = globalThis.ipHits || {};
    const now = Date.now();
    const lastHit = globalThis.ipHits[ip] || 0;

    if (now - lastHit < 60000) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again." }), { status: 429 });
    }
    globalThis.ipHits[ip] = now;

    // EMAIL THROTTLE — max 3 emails per hour
    globalThis.emailHits = globalThis.emailHits || {};
    const record = globalThis.emailHits[email] || { count: 0, timestamp: now };

    if (now - record.timestamp < 3600000 && record.count >= 3) {
      return new Response(JSON.stringify({ error: "Rate limit: max 3 invites per hour." }), { status: 429 });
    }

    if (now - record.timestamp >= 3600000) {
      record.count = 0;
      record.timestamp = now;
    }

    record.count++;
    globalThis.emailHits[email] = record;

    // SECRET INVITE LOG (прочитај го на приватна URL)
    globalThis.inviteLog = globalThis.inviteLog || [];
    globalThis.inviteLog.push({ email, ip, time: new Date().toISOString() });

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
        html: `<p>Welcome, warrior.</p>
               <p>Your access is granted.</p>
               <a href="${testerLink}">ENTER THE SKY TRIAL</a>`
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

