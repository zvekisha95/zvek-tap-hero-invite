export default async function handler(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.endsWith("@gmail.com")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gmail only" }),
        { status: 400 }
      );
    }

    // Resend API vars
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const link = Deno.env.get("TEST_LINK");

    if (!apiKey || !link) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing API KEY" }),
        { status: 500 }
      );
    }

    // Send mail
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zvek Tap Hero <invite@zvekisha.dev>",
        to: email,
        subject: "Your Zvek Tap Hero Access Link",
        html: `<h1>Access Granted</h1>
               <p>Your test link:</p>
               <a href="${link}">${link}</a>`
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
