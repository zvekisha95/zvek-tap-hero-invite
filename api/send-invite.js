export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !email.endsWith("@gmail.com")) {
    return res.status(400).json({ ok: false, error: "Gmail only" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const link = process.env.TEST_LINK;

  try {
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
        html: `<h1>Access Granted</h1><p>Tap below:</p><a href="${link}">${link}</a>`
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
