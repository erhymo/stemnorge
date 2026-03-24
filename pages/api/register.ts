import type { NextApiRequest, NextApiResponse } from 'next';

import { registerUser } from '../../lib/auth';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';
import { verifyTurnstileToken } from '../../lib/turnstile';

const REGISTER_RATE_LIMIT = { namespace: 'register', maxRequests: 5, windowSeconds: 600 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).end();
    return;
  }

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, REGISTER_RATE_LIMIT);

  if (!limit.allowed) {
    res.status(429).json({ error: `For mange forsøk. Prøv igjen om ${limit.retryAfterSeconds} sekunder.` });
    return;
  }

  const { email, password, name, turnstileToken } = req.body ?? {};

  const turnstileOk = await verifyTurnstileToken(turnstileToken);

  if (!turnstileOk) {
    res.status(400).json({ error: 'Verifisering feilet. Prøv å laste siden på nytt.' });
    return;
  }

  if (
    typeof email !== 'string' ||
    typeof name !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password.trim() ||
    !name.trim()
  ) {
    res.status(400).json({ error: 'Navn, e-post og passord er påkrevd.' });
    return;
  }

  try {
    const result = await registerUser(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bruker finnes allerede eller ugyldig data.';
    const status = message.includes('allerede') ? 409 : 400;
    res.status(status).json({ error: message });
  }
}
