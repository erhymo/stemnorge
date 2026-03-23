import type { NextApiRequest, NextApiResponse } from 'next';

import { loginUser } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
    res.status(400).json({ error: 'E-post og passord er påkrevd.' });
    return;
  }

  const result = await loginUser(email, password);

  if (!result) {
    res.status(401).json({ error: 'Feil e-postadresse eller passord.' });
    return;
  }

  if (!result.verified) {
    res.status(403).json({ error: 'E-postadressen din er ikke verifisert. Sjekk innboksen din.', code: 'EMAIL_NOT_VERIFIED' });
    return;
  }

  res.status(200).json({ token: result.token, user: result.user });
}
