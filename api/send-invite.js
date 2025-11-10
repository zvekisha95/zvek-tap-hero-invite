let memory = {};

export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const today = new Date().toISOString().slice(0,10);

  if (!memory[ip]) {
    memory[ip] = { last: 0, count: 0, day: today };
  }

  // reset daily counter
  if (memory[ip].day !== today) {
    memory[ip].day = today;
    memory[ip].count = 0;
  }

  // limit 1 request per 20 seconds
  if (now - memory[ip].last < 20000) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again." }), {
      status: 429
    });
  }

  // max 5 per day
  if (memory[ip].count >= 5) {
    return new Response(JSON.stringify({ error: "Daily limit reached." }), {
      status: 429
    });
  }

  // update stats
  memory[ip].last = now;
  memory[ip].count++;

  // email sending logic
  try {
    const body = await request.json();
    const email = (body.email || "").trim();

    if (!email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Gmail only" }), { status: 400 });
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const LINK = process.env.TEST_LINK;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <invite@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Tester Invite",
        html: `<p>Click here:</p><a href="${LINK}">${LINK}</a>`
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
