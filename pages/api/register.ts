import type { NextApiRequest, NextApiResponse } from 'next';

import { registerUser } from '../../lib/auth';
import { verifySmsVerificationCode } from '../../lib/sms-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { phone, code, name } = req.body ?? {};

  if (
    typeof phone !== 'string' ||
    typeof name !== 'string' ||
    typeof code !== 'string' ||
    !phone.trim() ||
    !code.trim() ||
    !name.trim()
  ) {
    res.status(400).json({ error: 'Navn, telefonnummer og SMS-kode er påkrevd.' });
    return;
  }

  const verification = await verifySmsVerificationCode(phone, 'register', code);

  if (!verification.ok) {
    res.status(400).json({ error: verification.error });
    return;
  }

  try {
    const result = await registerUser(verification.normalizedPhone, name);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bruker finnes allerede eller ugyldig data.';
    const status = message.includes('allerede') ? 409 : 400;
    res.status(status).json({ error: message });
  }
}
