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

export async function sendPasswordResetEmail({ to, code, name }) {
  const from = process.env.EMAIL_FROM || "Ascendance <onboarding@resend.dev>";
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h2 style="color: #b01834; font-family: Georgia, serif;">Reset Your Password</h2>
      <p>Hello ${name || "Reader"},</p>
      <p>We received a request to reset your password for Ascendance. Use the code below to complete the reset process.</p>
      <div style="margin: 32px 0; padding: 24px; background: rgba(176,24,52,0.05); text-align: center; border-radius: 8px;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #b01834;">${code}</div>
      </div>
      <p style="color: #666; font-size: 14px;">This code expires in 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">BrandZilla Technologies</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Ascendance Password Reset",
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Password reset email failed: ${errorText}`);
  }

  return { ok: true, provider: "resend" };
}

export async function sendAdminTwoFactorEmail({ to, code, challengeId }) {
  const from = process.env.EMAIL_FROM || "Ascendance <onboarding@resend.dev>";
  const subject = "Ascendance admin login code";
  const text = `A login to the Ascendance admin dashboard was requested.\n\nYour authentication code is ${code}. It expires in 10 minutes.\n\nIf this was not you, do not share this code and change your admin password.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #19151a; line-height: 1.6">
      <h1 style="color: #48006E">Ascendance Admin</h1>
      <p>A login to the Ascendance admin dashboard was requested.</p>
      <p>Your authentication code is:</p>
      <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #48006E">${code}</p>
      <p>This code expires in 10 minutes and can only be used once.</p>
      <p>If this was not you, do not share this code and change your admin password.</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[Ascendance admin authentication] ${to}: ${code}`);
    return { ok: true, provider: "console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `admin-2fa-${challengeId}`
    },
    body: JSON.stringify({ from, to, subject, text, html })
  });

  if (!response.ok) {
    throw new Error("Unable to send the admin authentication code.");
  }

  return { ok: true, provider: "resend" };
}

export async function sendGiftNotificationEmail({ to, accessCode, senderName, baseUrl }) {
  const from = process.env.EMAIL_FROM || "Ascendance <onboarding@resend.dev>";
  const subject = `${senderName} sent you the complete Ascendance Trilogy!`;
  const text = `Hello,\n\n${senderName} has sent you the complete Ascendance Trilogy as a gift!\n\nYour access code is: ${accessCode}\n\nTo redeem it and start reading, click the link below or log in and enter the code on the Gift tab:\n\n${baseUrl}/?giftCode=${accessCode}\n\nHappy reading,\nBrandZilla Tech Limited`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h2 style="color: #48006E; font-family: Georgia, serif;">A Gift for You!</h2>
      <p>Hello,</p>
      <p><strong>${senderName}</strong> has sent you the complete Ascendance Trilogy as a gift!</p>
      <p>You can unlock all three books on your account using the 8-character access code below:</p>
      <div style="margin: 32px 0; padding: 24px; background: rgba(72,0,110,0.05); text-align: center; border-radius: 8px;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #48006E;">${accessCode}</div>
      </div>
      <p>To redeem it immediately, click the button below to register or log in with your email address (<strong>${to}</strong>):</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/?giftCode=${accessCode}" style="background-color: #48006E; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redeem Your Gift</a>
      </div>
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser: <br/> ${baseUrl}/?giftCode=${accessCode}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">BrandZilla Technologies</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[Ascendance gift email] ${to}: code ${accessCode} from ${senderName} (Link: ${baseUrl}/?giftCode=${accessCode})`);
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
    throw new Error(`Gift email notification failed: ${errorText}`);
  }

  return { ok: true, provider: "resend" };
}

