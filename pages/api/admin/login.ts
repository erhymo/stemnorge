import type { NextApiRequest, NextApiResponse } from "next";

import {
  createAdminSessionCookie,
  createAdminSessionToken,
  isAdminConfigured,
  validateAdminCredentials,
} from "../../../lib/admin-auth";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Admin-innlogging er ikke konfigurert i miljøet." });
    return;
  }

  const username = readString(req.body?.username);
  const password = readString(req.body?.password);

  if (!username || !password) {
    res.status(400).json({ error: "Brukernavn og admin-passord er påkrevd." });
    return;
  }

  if (!validateAdminCredentials(username, password)) {
    res.status(401).json({ error: "Ugyldig admin-innlogging." });
    return;
  }

  const token = createAdminSessionToken(username);
  res.setHeader("Set-Cookie", createAdminSessionCookie(token));
  res.status(200).json({ ok: true });
}