import type { NextApiRequest, NextApiResponse } from "next";

import { requestPasswordReset } from "../../../lib/auth";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";

const FORGOT_PASSWORD_RATE_LIMIT = { namespace: "forgot-password", maxRequests: 5, windowSeconds: 600 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, FORGOT_PASSWORD_RATE_LIMIT);

  if (!limit.allowed) {
    res.status(429).json({ error: `For mange forsøk. Prøv igjen om ${limit.retryAfterSeconds} sekunder.` });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!email) {
    res.status(400).json({ error: "E-post er påkrevd." });
    return;
  }

  try {
    await requestPasswordReset(email);
  } catch (error) {
    console.error("Feil ved passord-reset:", error);
  }

  // Always return success to avoid leaking whether the email exists
  res.status(200).json({ ok: true, message: "Hvis kontoen finnes, har vi sendt en lenke for å tilbakestille passordet." });
}

