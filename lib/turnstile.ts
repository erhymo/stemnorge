import { getTurnstileSecretKey } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Turnstile token server-side.
 * Returns true if the token is valid, false otherwise.
 * If no secret key is configured (e.g. in dev), verification is skipped.
 */
export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = getTurnstileSecretKey();

  // Skip verification in development when no key is set
  if (!secret) {
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

