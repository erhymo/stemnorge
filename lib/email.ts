const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const DEFAULT_FROM_EMAIL = "noreply@stemnorge.no";
const DEFAULT_FROM_NAME = "StemNorge";

function getSendGridApiKey() {
  return process.env.SENDGRID_API_KEY?.trim() || null;
}

function getFromEmail() {
  return process.env.SENDGRID_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}

function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const apiKey = getSendGridApiKey();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailConfigurationError("SENDGRID_API_KEY må settes i production.");
    }

    console.info(`[email:mock] to=${to} subject=${subject}\n${text}`);
    return { provider: "mock" as const, accepted: true };
  }

  const response = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: getFromEmail(), name: DEFAULT_FROM_NAME },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SendGrid feil (${response.status}): ${body}`);
  }

  return { provider: "sendgrid" as const, accepted: true };
}

export function buildVerificationEmail(name: string, token: string) {
  const url = `${getAppBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  return {
    subject: "Bekreft e-postadressen din — StemNorge",
    text: `Hei ${name},\n\nKlikk på lenken for å bekrefte e-postadressen din:\n${url}\n\nLenken er gyldig i 24 timer.\n\nMvh StemNorge`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0e7490">Bekreft e-postadressen din</h2>
        <p>Hei ${name},</p>
        <p>Klikk på knappen under for å bekrefte e-postadressen din:</p>
        <a href="${url}" style="display:inline-block;background:#22d3ee;color:#0f172a;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">Bekreft e-post</a>
        <p style="margin-top:16px;font-size:13px;color:#94a3b8">Lenken er gyldig i 24 timer. Hvis du ikke opprettet denne kontoen, kan du ignorere denne e-posten.</p>
      </div>
    `.trim(),
  };
}

export function buildPasswordResetEmail(name: string, token: string) {
  const url = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  return {
    subject: "Tilbakestill passordet ditt — StemNorge",
    text: `Hei ${name},\n\nKlikk på lenken for å tilbakestille passordet ditt:\n${url}\n\nLenken er gyldig i 1 time.\n\nHvis du ikke ba om dette, kan du ignorere denne e-posten.\n\nMvh StemNorge`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0e7490">Tilbakestill passordet ditt</h2>
        <p>Hei ${name},</p>
        <p>Klikk på knappen under for å velge et nytt passord:</p>
        <a href="${url}" style="display:inline-block;background:#22d3ee;color:#0f172a;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">Tilbakestill passord</a>
        <p style="margin-top:16px;font-size:13px;color:#94a3b8">Lenken er gyldig i 1 time. Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten.</p>
      </div>
    `.trim(),
  };
}

