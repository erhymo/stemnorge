export const SITE_VISIT_COOLDOWN_MS = 30 * 60 * 1000;
export const SITE_VISIT_STORAGE_KEY = "stemnorge:last-site-visit-at";

export function normalizeTrackedPathname(pathname: string | null | undefined) {
  if (typeof pathname !== "string") {
    return null;
  }

  const trimmed = pathname.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
}

export function isTrackedPublicPathname(pathname: string | null | undefined) {
  const normalized = normalizeTrackedPathname(pathname);

  if (!normalized) {
    return false;
  }

  return !normalized.startsWith("/admin") && !normalized.startsWith("/api") && !normalized.startsWith("/_next");
}