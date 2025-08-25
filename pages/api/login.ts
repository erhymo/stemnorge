import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  if (!result) return res.status(401).json({ error: 'Feil e-post eller passord.' });
  res.status(200).json(result);
}
