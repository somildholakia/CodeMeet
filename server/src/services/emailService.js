const clientBaseUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    const message = `Email delivery is not configured. Recipient: ${to}. Subject: ${subject}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
    }
    console.warn(message);
    console.warn(text);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error('Email provider rejected a message:', response.status, details);
    throw new Error('We could not send the email right now. Please try again later.');
  }
}

export async function sendVerificationEmail(user, token) {
  const link = `${clientBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const safeName = String(user.name || 'there').replace(/[<>"']/g, '');
  await sendEmail({
    to: user.email,
    subject: 'Verify your CodeMeet email',
    text: `Hi ${safeName}, verify your CodeMeet email by opening this link: ${link}\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#28231f"><h1 style="margin:0 0 12px">Welcome to CodeMeet</h1><p>Hi ${safeName}, confirm your email address to activate your account.</p><p style="margin:28px 0"><a href="${link}" style="background:#f45d3e;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">Verify email</a></p><p style="color:#6f655d;font-size:13px">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p></div>`,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${clientBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const safeName = String(user.name || 'there').replace(/[<>"']/g, '');
  await sendEmail({
    to: user.email,
    subject: 'Reset your CodeMeet password',
    text: `Hi ${safeName}, reset your password using this link: ${link}\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#28231f"><h1 style="margin:0 0 12px">Reset your password</h1><p>Hi ${safeName}, use the button below to choose a new CodeMeet password.</p><p style="margin:28px 0"><a href="${link}" style="background:#f45d3e;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">Reset password</a></p><p style="color:#6f655d;font-size:13px">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p></div>`,
  });
}
