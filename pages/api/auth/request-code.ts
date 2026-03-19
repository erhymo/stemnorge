import type { NextApiRequest, NextApiResponse } from 'next';

import { doesUserExist } from '../../../lib/auth';
import { normalizePhoneNumber } from '../../../lib/phone';
import { parseSmsVerificationPurpose, requestSmsVerificationCode } from '../../../lib/sms-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { phone, purpose } = req.body ?? {};

  if (typeof phone !== 'string' || !phone.trim()) {
    res.status(400).json({ error: 'Telefonnummer er påkrevd.' });
    return;
  }

  const parsedPurpose = parseSmsVerificationPurpose(purpose);

  if (!parsedPurpose) {
    res.status(400).json({ error: 'Ugyldig formål for SMS-koden.' });
    return;
  }

  try {
    if (!normalizePhoneNumber(phone)) {
      res.status(400).json({ error: 'Ugyldig telefonnummer.' });
      return;
    }

    const userExists = await doesUserExist(phone);

    if (parsedPurpose === 'login' && !userExists) {
      res.status(404).json({ error: 'Fant ingen konto for dette telefonnummeret.' });
      return;
    }

    if (parsedPurpose === 'register' && userExists) {
      res.status(409).json({ error: 'Dette telefonnummeret har allerede en konto.' });
      return;
    }

    const result = await requestSmsVerificationCode(phone, parsedPurpose);
    res.status(202).json({
      ok: true,
      normalizedPhone: result.normalizedPhone,
      expiresAt: result.expiresAt.toISOString(),
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kunne ikke sende SMS-kode.';
    const status =
      error instanceof Error && error.name === 'SmsRateLimitError'
        ? 429
        : error instanceof Error && (error.name === 'SmsConfigurationError' || error.name === 'EnvironmentConfigurationError')
          ? 503
          : 400;

    res.status(status).json({ error: message });
  }
}