// /api/send-invite.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const { email, trap } = req.body || {};

    // Honeypot
    if (trap) return res.status(400).json({ ok: false, error: 'Bot blocked' });

    // Gmail-only
    if (!email || !email.endsWith('@gmail.com')) {
      return res.status(400).json({ ok: false, error: 'Gmail only' });
    }

    // RATE LIMIT (1 request per IP / 30s)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    global.limits = global.limits || {};
    const now = Date.now();
    if (global.limits[ip] && now - global.limits[ip] < 30_000) {
      return res.status(429).json({ ok: false, error: 'Too many requests. Try again.' });
    }
    global.limits[ip] = now;

    // LOG (in-memory)
    global.inviteLog = global.inviteLog || [];
    global.inviteLog.push({ email, time: new Date().toISOString(), ip });

    // RESEND config (use process.env in Node)
    const apiKey = process.env.RESEND_API_KEY;
    const link = process.env.TEST_LINK;

    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Missing RESEND_API_KEY on server' });
    }
    if (!link) {
      return res.status(500).json({ ok: false, error: 'Missing TEST_LINK on server' });
    }

    // call Resend with a timeout (AbortController)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    let r;
    try {
      r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Zvek Tap Hero <onboarding@resend.dev>',
          to: email,
          subject: 'Your Zvek Tap Hero Access Link',
          html: `<h1>Zvek Access Granted</h1><p>Your link:</p><a href="${link}">${link}</a>`
        }),
        signal: controller.signal
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        return res.status(504).json({ ok: false, error: 'Upstream request timed out' });
      }
      return res.status(500).json({ ok: false, error: 'Network error: ' + err.message });
    } finally {
      clearTimeout(timeout);
    }

    const text = await r.text().catch(()=> '');
    // return different codes for non-2xx
    if (!r.ok) {
      // preserve useful message if available
      let detail = text;
      try { detail = JSON.parse(text); } catch(e) {}
      return res.status(r.status).json({ ok: false, error: 'Resend error', detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
