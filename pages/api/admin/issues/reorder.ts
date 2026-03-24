import type { NextApiRequest, NextApiResponse } from "next";

import { getAdminSessionFromCookieHeader, verifyCsrfOrigin } from "../../../../lib/admin-auth";
import { swapIssueSchedules } from "../../../../lib/issues";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST").status(405).end();
    return;
  }

  if (!verifyCsrfOrigin(req.headers)) {
    res.status(403).json({ error: "Ugyldig opprinnelse for forespørselen." });
    return;
  }

  const adminSession = getAdminSessionFromCookieHeader(req.headers.cookie);

  if (!adminSession) {
    res.status(401).json({ error: "Admin-innlogging kreves." });
    return;
  }

  const { issueIdA, issueIdB } = req.body ?? {};

  if (typeof issueIdA !== "number" || typeof issueIdB !== "number" || issueIdA <= 0 || issueIdB <= 0) {
    res.status(400).json({ error: "To gyldige saks-IDer er påkrevd." });
    return;
  }

  try {
    const result = await swapIssueSchedules(issueIdA, issueIdB);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke bytte rekkefølge.";
    const status = message.includes("Fant ikke") ? 404 : 400;
    res.status(status).json({ error: message });
  }
}

