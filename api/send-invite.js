export default async function handler(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gmail only" }),
        { status: 400 }
      );
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const link = Deno.env.get("TEST_LINK");

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <onboarding@resend.dev>",
        to: email,
        subject: "Zvek Tap Hero Test Access",
        html: `<h1>Your Access Link</h1><a href="${link}">${link}</a>`
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
