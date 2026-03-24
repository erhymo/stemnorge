import type { NextApiRequest, NextApiResponse } from "next";

import { resendVerificationEmail } from "../../../lib/auth";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";

const RESEND_VERIFICATION_RATE_LIMIT = { namespace: "resend-verification", maxRequests: 5, windowSeconds: 600 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST").status(405).end();
    return;
  }

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, RESEND_VERIFICATION_RATE_LIMIT);

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
    await resendVerificationEmail(email);
    // Always return success to avoid leaking whether the email exists
    res.status(200).json({ ok: true, message: "Hvis kontoen finnes, har vi sendt en ny verifiseringslenke." });
  } catch {
    res.status(500).json({ error: "Kunne ikke sende e-post. Prøv igjen senere." });
  }
}

