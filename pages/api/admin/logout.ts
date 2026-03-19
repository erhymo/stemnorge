import type { NextApiRequest, NextApiResponse } from "next";

import { clearAdminSessionCookie } from "../../../lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  res.setHeader("Set-Cookie", clearAdminSessionCookie());
  res.status(200).json({ ok: true });
}