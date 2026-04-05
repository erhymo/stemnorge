import type { NextApiRequest, NextApiResponse } from "next";

import { getAdminSessionFromCookieHeader, verifyCsrfOrigin } from "../../../../lib/admin-auth";
import { generateAdminTips } from "../../../../lib/admin-tips-generator";

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

  try {
    const tips = await generateAdminTips();
    res.status(200).json({ tips });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke generere tips.";
    res.status(400).json({ error: message });
  }
}
