// ✅ Simple anti-spam rate-limit memory
let lastRequests = {}; 
// Format: { "IP": { lastTime: 123456, dayCount: 3, dayStamp: "2025-11-10" } }

export default async (request) => {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const today = new Date().toISOString().slice(0,10);

  if (!lastRequests[ip]) {
    lastRequests[ip] = { lastTime: 0, dayCount: 0, dayStamp: today };
  }

  let data = lastRequests[ip];

  // reset daily counter
  if (data.dayStamp !== today) {
    data.dayStamp = today;
    data.dayCount = 0;
  }

  // ✅ BLOCK: more than 1 request per 20 sec
  if (now - data.lastTime < 20000) {
    return new Response(JSON.stringify({
      error: "Too many requests — wait a moment."
    }), { status: 429 });
  }

  // ✅ BLOCK: more than 5 per day
  if (data.dayCount >= 5) {
    return new Response(JSON.stringify({
      error: "Daily limit reached — try again tomorrow."
    }), { status: 429 });
  }

  // ✅ update counters
  data.lastTime = now;
  data.dayCount++;

  // ✅ Continue with your REAL email sending code
  try {
    const body = await request.json();
    const email = (body.email || "").trim();

    if (!email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Gmail only" }), { status: 400 });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const testerLink = Deno.env.get("TEST_LINK");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <invite@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Tester Invite",
        html: `<p>Click here:</p><a href="${testerLink}">${testerLink}</a>`,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
