import type { NextApiRequest, NextApiResponse } from "next";

import { getAdminSessionFromCookieHeader } from "../../../../lib/admin-auth";
import { generateAdminIssueDraft } from "../../../../lib/admin-issue-draft";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const adminSession = getAdminSessionFromCookieHeader(req.headers.cookie);

  if (!adminSession) {
    res.status(401).json({ error: "Admin-innlogging kreves for å generere utkast." });
    return;
  }

  const payload = typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : {};
  const topic = readString(payload.topic);
  const context = readString(payload.context);

  if (!topic) {
    res.status(400).json({ error: "Tema er påkrevd for å generere et utkast." });
    return;
  }

  try {
    const draft = generateAdminIssueDraft({ topic, context: context || undefined });
    res.status(200).json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke generere utkast.";
    res.status(400).json({ error: message });
  }
}