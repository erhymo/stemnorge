import type { NextApiRequest, NextApiResponse } from 'next';

import { getAdminIssueMutationErrorStatus, parseAdminIssueInput } from '../../../lib/admin-issue-payload';
import { getAdminSessionFromCookieHeader, verifyCsrfOrigin } from '../../../lib/admin-auth';
import { createIssue } from '../../../lib/issues';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).end();
    return;
  }

  if (!verifyCsrfOrigin(req.headers)) {
    res.status(403).json({ error: 'Ugyldig opprinnelse for forespørselen.' });
    return;
  }

  const adminSession = getAdminSessionFromCookieHeader(req.headers.cookie);

  if (!adminSession) {
    res.status(401).json({ error: 'Admin-innlogging kreves for å opprette saker.' });
    return;
  }

  const input = parseAdminIssueInput(req.body);

  if (!input) {
    res.status(400).json({ error: 'Tittel, spørsmål, tekster og gyldige tidspunkter er påkrevd.' });
    return;
  }

  try {
    const issue = await createIssue(input);

    res.status(201).json({ issue: { id: issue.id, slug: issue.slug } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kunne ikke opprette saken.';
    const status = getAdminIssueMutationErrorStatus(message);
    res.status(status).json({ error: message });
  }
}