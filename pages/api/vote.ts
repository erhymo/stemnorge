import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../lib/auth';
import { getCurrentIssueRecord, isIssueOpen } from '../../lib/issues';
import { prisma } from '../../lib/prisma';

function isVoteValue(value: unknown): value is 'for' | 'mot' {
  return value === 'for' || value === 'mot';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).end();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : null;
  const { value } = req.body ?? {};

  if (!token || !isVoteValue(value)) {
    res.status(400).json({ error: 'Ugyldig stemmedata.' });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Ugyldig token.' });
    return;
  }

  const { userId } = payload;
  const issue = await getCurrentIssueRecord();

  if (!issue || !isIssueOpen(issue)) {
    res.status(409).json({ error: 'Det er ingen åpen sak å stemme på akkurat nå.' });
    return;
  }

  const vote = await prisma.vote.upsert({
    where: {
      userId_issueId: {
        userId,
        issueId: issue.id,
      },
    },
    update: {
      value,
    },
    create: {
      userId,
      issueId: issue.id,
      value,
    },
  });

  res.status(201).json({ vote, issue: { slug: issue.slug } });
}
