import type { NextApiRequest, NextApiResponse } from "next";

import { verifyEmailToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    res.redirect("/login?verified=invalid");
    return;
  }

  const success = await verifyEmailToken(token);

  if (success) {
    res.redirect("/login?verified=ok");
  } else {
    res.redirect("/login?verified=invalid");
  }
}

