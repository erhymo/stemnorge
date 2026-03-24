import { getTurnstileSecretKey } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Turnstile token server-side.
 * Returns true if the token is valid, false otherwise.
 *
 * In production, verification is mandatory – if TURNSTILE_SECRET_KEY is not
 * configured the check will always fail. In development, missing key skips
 * verification to simplify local testing.
 */
export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = getTurnstileSecretKey();

  if (!secret) {
    // In production, a missing key means misconfiguration – reject.
    if (process.env.NODE_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY is not set – rejecting verification in production.");
      return false;
    }

    // In development, skip verification for convenience.
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

