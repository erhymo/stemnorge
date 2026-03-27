import { timingSafeEqual } from "node:crypto";

import jwt from "jsonwebtoken";

import { getAdminSessionSecret } from "@/lib/env";

export const ADMIN_SESSION_COOKIE_NAME = "stemnorge_admin_session";

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || "";
const ADMIN_SESSION_SECRET = getAdminSessionSecret();

export type AdminSession = {
  role: "admin";
  username: string;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookieHeader(cookieHeader?: string | string[]) {
  const rawHeader = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

  if (!rawHeader) {
    return {} as Record<string, string>;
  }

  return rawHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...rawValueParts] = part.trim().split("=");

    if (!rawName || rawValueParts.length === 0) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join("="));
    return cookies;
  }, {});
}

export function isAdminConfigured() {
  return Boolean(ADMIN_PASSWORD);
}

export function validateAdminCredentials(username: string, password: string) {
  if (!isAdminConfigured()) {
    return false;
  }

  return safeEqual(username.trim(), ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

export function createAdminSessionToken(username: string) {
  return jwt.sign({ role: "admin", username }, ADMIN_SESSION_SECRET, {
    expiresIn: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, ADMIN_SESSION_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      payload.role !== "admin" ||
      typeof payload.username !== "string"
    ) {
      return null;
    }

    return payload as AdminSession;
  } catch {
    return null;
  }
}

export function getAdminSessionFromCookieHeader(cookieHeader?: string | string[]) {
  const cookies = parseCookieHeader(cookieHeader);
  return verifyAdminSessionToken(cookies[ADMIN_SESSION_COOKIE_NAME]);
}

export function createAdminSessionCookie(token: string) {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearAdminSessionCookie() {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Verify that the request Origin matches the app's own origin.
 * Blocks cross-site POST/PATCH/DELETE requests that rely on cookie auth.
 * Returns true if the origin is valid or missing (non-browser clients).
 */
export function verifyCsrfOrigin(headers: Record<string, string | string[] | undefined>) {
  const origin = typeof headers.origin === "string" ? headers.origin : undefined;

  // Non-browser clients (curl, Postman) may not send Origin – allow them
  // since they cannot attach cookies cross-site.
  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>();

  // Primary app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    try {
      const parsed = new URL(appUrl).origin;
      allowedOrigins.add(parsed);

      // Also allow www variant (or strip www if configured with www)
      const url = new URL(appUrl);
      if (url.hostname.startsWith("www.")) {
        allowedOrigins.add(`${url.protocol}//${url.hostname.slice(4)}`);
      } else {
        allowedOrigins.add(`${url.protocol}//www.${url.hostname}`);
      }
    } catch {
      // ignore malformed URL
    }
  }

  // Vercel preview/production URLs
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    allowedOrigins.add(`https://${vercelUrl}`);
  }

  // In development without any configured URLs, allow all origins
  if (allowedOrigins.size === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return allowedOrigins.has(origin);
}