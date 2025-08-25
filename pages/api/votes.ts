import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const forVotes = await prisma.vote.count({ where: { value: 'for' } });
  const motVotes = await prisma.vote.count({ where: { value: 'mot' } });
  const total = await prisma.vote.count();
  res.status(200).json({ forVotes, motVotes, total });
}
