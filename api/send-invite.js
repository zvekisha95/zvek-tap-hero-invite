export default async (request) => {
  try {
    const { email } = await request.json();

    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Gmail only" }), { status: 400 });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const testerLink = Deno.env.get("TEST_LINK");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <onboarding@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Tester Invite",
        html: `<p>Click here:</p><a href="${testerLink}">${testerLink}</a>`
      })
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
