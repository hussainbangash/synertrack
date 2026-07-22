/**
 * Minimal, pluggable email sender.
 *
 * If `RESEND_API_KEY` is set, emails are sent via the Resend HTTP API (no extra
 * dependency - just `fetch`). Otherwise the message is logged to the server
 * console, so the password-reset flow works out of the box in development and
 * on hosts without an email provider configured (grab the link from the logs).
 */

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function send({ to, subject, html, text }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log(
      `\n[email:console-fallback] No RESEND_API_KEY set - logging instead of sending.\n` +
        `To: ${to}\nSubject: ${subject}\n${text}\n`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    throw new Error(`Resend request failed (${res.status}): ${await res.text()}`);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Reset your password";
  const text =
    `Someone requested a password reset for your account.\n\n` +
    `Reset it using this link (valid for 30 minutes):\n${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email.`;
  const html =
    `<p>Someone requested a password reset for your account.</p>` +
    `<p>Reset it using the link below (valid for 30 minutes):</p>` +
    `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
    `<p>If you didn't request this, you can safely ignore this email.</p>`;

  await send({ to, subject, html, text });
}
