export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { email } = req.body;

    if (!email || !email.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Gmail only" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const testerLink = process.env.TEST_LINK;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <onboarding@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Tester Invite",
        html: `<p>Click here to join testing:</p><a href="${testerLink}">${testerLink}</a>`
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
