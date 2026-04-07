import type { NextApiRequest, NextApiResponse } from "next";

import { recordSiteVisit } from "@/lib/site-analytics";
import { isTrackedPublicPathname } from "@/lib/site-analytics-shared";

function readPathname(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  return typeof (body as Record<string, unknown>).pathname === "string"
    ? (body as Record<string, string>).pathname
    : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST").status(405).end();
    return;
  }

  const pathname = readPathname(req.body);

  if (!isTrackedPublicPathname(pathname)) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  try {
    await recordSiteVisit(pathname);
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: "Kunne ikke lagre besøk." });
  }
}