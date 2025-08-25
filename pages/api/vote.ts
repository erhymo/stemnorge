import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, value } = req.body;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Ugyldig token.' });
  const userId = payload.userId;
  // Sjekk om bruker har stemt før
  const existing = await prisma.vote.findFirst({ where: { userId } });
  if (existing) return res.status(400).json({ error: 'Du har allerede stemt.' });
  const vote = await prisma.vote.create({ data: { userId, value } });
  res.status(201).json({ vote });
}
