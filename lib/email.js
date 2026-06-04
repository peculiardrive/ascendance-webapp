export async function sendVerificationEmail({ to, code, name }) {
  const from = process.env.EMAIL_FROM || "Ascendance <onboarding@resend.dev>";
  const subject = "Your Ascendance verification code";
  const text = `Hello ${name || "Reader"},\n\nYour Ascendance verification code is ${code}. It expires in 15 minutes.\n\nBrandZilla Tech Limited`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #19151a; line-height: 1.6">
      <h1 style="color: #48006E">Ascendance</h1>
      <p>Hello ${name || "Reader"},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #48006E">${code}</p>
      <p>This code expires in 15 minutes.</p>
      <p>BrandZilla Tech Limited</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[Ascendance verification] ${to}: ${code}`);
    return { ok: true, provider: "console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text, html })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verification email failed: ${errorText}`);
  }

  return { ok: true, provider: "resend" };
}
