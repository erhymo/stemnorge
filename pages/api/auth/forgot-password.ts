import type { NextApiRequest, NextApiResponse } from "next";

import { requestPasswordReset } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!email) {
    res.status(400).json({ error: "E-post er påkrevd." });
    return;
  }

  try {
    await requestPasswordReset(email);
  } catch (error) {
    console.error("Feil ved passord-reset:", error);
  }

  // Always return success to avoid leaking whether the email exists
  res.status(200).json({ ok: true, message: "Hvis kontoen finnes, har vi sendt en lenke for å tilbakestille passordet." });
}

