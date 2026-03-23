import type { NextApiRequest, NextApiResponse } from "next";

import { getAdminSessionFromCookieHeader } from "../../../../../lib/admin-auth";
import { publishIssueNow } from "../../../../../lib/issues";

function readIssueId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const adminSession = getAdminSessionFromCookieHeader(req.headers.cookie);

  if (!adminSession) {
    res.status(401).json({ error: "Admin-innlogging kreves." });
    return;
  }

  const issueId = readIssueId(req.query.issueId);

  if (!issueId) {
    res.status(400).json({ error: "Ugyldig saks-ID." });
    return;
  }

  try {
    const issue = await publishIssueNow(issueId);
    res.status(200).json({ ok: true, issue: { id: issue.id, slug: issue.slug } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke publisere saken.";
    const status = message.includes("Fant ikke") ? 404 : message.includes("allerede aktiv") ? 409 : 400;
    res.status(status).json({ error: message });
  }
}

