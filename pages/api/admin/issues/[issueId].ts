import type { NextApiRequest, NextApiResponse } from "next";

import { getAdminIssueMutationErrorStatus, parseAdminIssueInput } from "../../../../lib/admin-issue-payload";
import { getAdminSessionFromCookieHeader } from "../../../../lib/admin-auth";
import { deletePlannedIssue, updatePlannedIssue } from "../../../../lib/issues";

function readIssueId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.status(405).end();
    return;
  }

  const adminSession = getAdminSessionFromCookieHeader(req.headers.cookie);

  if (!adminSession) {
    res.status(401).json({ error: "Admin-innlogging kreves for å endre planlagte saker." });
    return;
  }

  const issueId = readIssueId(req.query.issueId);

  if (!issueId) {
    res.status(400).json({ error: "Ugyldig saks-ID." });
    return;
  }

  try {
    if (req.method === "PATCH") {
      const input = parseAdminIssueInput(req.body);

      if (!input) {
        res.status(400).json({ error: "Tittel, spørsmål, tekster og gyldige tidspunkter er påkrevd." });
        return;
      }

      const issue = await updatePlannedIssue(issueId, input);
      res.status(200).json({ issue: { id: issue.id, slug: issue.slug } });
      return;
    }

    const issue = await deletePlannedIssue(issueId);
    res.status(200).json({ ok: true, issue: { id: issue.id, slug: issue.slug } });
  } catch (error) {
    const fallbackMessage = req.method === "PATCH" ? "Kunne ikke oppdatere saken." : "Kunne ikke slette saken.";
    const message = error instanceof Error ? error.message : fallbackMessage;
    const status = getAdminIssueMutationErrorStatus(message);
    res.status(status).json({ error: message });
  }
}