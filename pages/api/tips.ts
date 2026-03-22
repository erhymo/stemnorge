import type { NextApiRequest, NextApiResponse } from "next";

import { createAgendaTip, isAgendaTipValidationError } from "../../lib/tips";

function readMessage(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  return typeof (body as Record<string, unknown>).message === "string" ? (body as Record<string, string>).message : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    await createAgendaTip({ message: readMessage(req.body) });
    res.status(201).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke sende inn tipset.";
    const status = isAgendaTipValidationError(message) ? 400 : 500;
    res.status(status).json({ error: status === 400 ? message : "Kunne ikke sende inn tipset." });
  }
}