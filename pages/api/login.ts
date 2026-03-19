import type { NextApiRequest, NextApiResponse } from 'next';

import { loginUser } from '../../lib/auth';
import { verifySmsVerificationCode } from '../../lib/sms-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { phone, code } = req.body ?? {};

  if (typeof phone !== 'string' || !phone.trim() || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'Telefonnummer og SMS-kode er påkrevd.' });
    return;
  }

  const verification = await verifySmsVerificationCode(phone, 'login', code);

  if (!verification.ok) {
    res.status(400).json({ error: verification.error });
    return;
  }

  const result = await loginUser(verification.normalizedPhone);

  if (!result) {
    res.status(404).json({ error: 'Fant ingen konto for dette telefonnummeret.' });
    return;
  }

  res.status(200).json(result);
}
