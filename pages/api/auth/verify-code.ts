import type { NextApiRequest, NextApiResponse } from 'next';

import { parseSmsVerificationPurpose, verifySmsVerificationCode } from '../../../lib/sms-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { phone, purpose, code } = req.body ?? {};

  if (typeof phone !== 'string' || !phone.trim() || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'Telefonnummer og kode er påkrevd.' });
    return;
  }

  const parsedPurpose = parseSmsVerificationPurpose(purpose);

  if (!parsedPurpose) {
    res.status(400).json({ error: 'Ugyldig formål for SMS-koden.' });
    return;
  }

  const result = await verifySmsVerificationCode(phone, parsedPurpose, code);

  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(200).json(result);
}