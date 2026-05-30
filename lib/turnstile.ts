import { getTurnstileSecretKey } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerificationResult =
  | { ok: true }
  | { ok: false; reason: "missing-secret" | "missing-token" | "provider-error" | "request-failed"; errorCodes?: string[] };

/**
 * Verify a Turnstile token server-side.
 * Returns true if the token is valid, false otherwise.
 *
 * In production, verification is mandatory – if TURNSTILE_SECRET_KEY is not
 * configured the check will always fail. In development, missing key skips
 * verification to simplify local testing.
 */
export async function verifyTurnstileTokenDetailed(token: string | undefined): Promise<TurnstileVerificationResult> {
  const secret = getTurnstileSecretKey();

  if (!secret) {
    // In production, a missing key means misconfiguration – reject.
    if (process.env.NODE_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY is not set – rejecting verification in production.");
      return { ok: false, reason: "missing-secret" };
    }

    // In development, skip verification for convenience.
    return { ok: true };
  }

  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

    if (data.success === true) {
      return { ok: true };
    }

    return { ok: false, reason: "provider-error", errorCodes: data["error-codes"] };
  } catch {
    return { ok: false, reason: "request-failed" };
  }
}

export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const result = await verifyTurnstileTokenDetailed(token);
  return result.ok;
}

