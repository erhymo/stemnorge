import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, name } = req.body;
  try {
    const user = await registerUser(email, password, name);
    res.status(201).json({ user });
  } catch {
    res.status(400).json({ error: 'Bruker finnes allerede eller ugyldig data.' });
  }
}
