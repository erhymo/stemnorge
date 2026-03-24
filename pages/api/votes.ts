import type { NextApiRequest, NextApiResponse } from 'next';
import { getIssueVoteSummary } from '../../lib/issues';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET').status(405).end();
    return;
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
  const summary = await getIssueVoteSummary(slug);

  if (!summary) {
    res.status(404).json({ error: 'Fant ingen sak for resultatforespørselen.' });
    return;
  }

  if (summary.isOpen) {
    res.status(200).json({
      slug: summary.slug,
      isOpen: true,
      supportLabel: summary.supportLabel,
      opposeLabel: summary.opposeLabel,
    });
    return;
  }

  res.status(200).json(summary);
}
