import type { NextApiRequest, NextApiResponse } from "next";

import { resetPassword } from "../../../lib/auth";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";

const RESET_PASSWORD_RATE_LIMIT = { namespace: "reset-password", maxRequests: 10, windowSeconds: 600 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST").status(405).end();
    return;
  }

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, RESET_PASSWORD_RATE_LIMIT);

  if (!limit.allowed) {
    res.status(429).json({ error: `For mange forsøk. Prøv igjen om ${limit.retryAfterSeconds} sekunder.` });
    return;
  }

  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!token || !password) {
    res.status(400).json({ error: "Token og nytt passord er påkrevd." });
    return;
  }

  try {
    await resetPassword(token, password);
    res.status(200).json({ ok: true, message: "Passordet er oppdatert. Du kan nå logge inn." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke tilbakestille passordet.";
    res.status(400).json({ error: message });
  }
}

