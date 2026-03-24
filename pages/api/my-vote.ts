import type { NextApiRequest, NextApiResponse } from "next";

import { verifyToken } from "../../lib/auth";
import { getCurrentIssueRecord } from "../../lib/issues";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    res.status(401).json({ error: "Mangler token." });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Ugyldig token." });
    return;
  }

  const issue = await getCurrentIssueRecord();

  if (!issue) {
    res.status(200).json({ vote: null });
    return;
  }

  const vote = await prisma.vote.findUnique({
    where: {
      userId_issueId: {
        userId: payload.userId,
        issueId: issue.id,
      },
    },
    select: { value: true, updatedAt: true },
  });

  res.status(200).json({ vote: vote ? { value: vote.value, updatedAt: vote.updatedAt } : null });
}

