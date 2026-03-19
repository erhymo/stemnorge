import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ORIGINAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

async function loadAdminAuth(overrides: Record<string, string | undefined> = {}) {
  vi.resetModules();
  setEnv("NODE_ENV", overrides.NODE_ENV ?? "test");
  setEnv("ADMIN_USERNAME", overrides.ADMIN_USERNAME);
  setEnv("ADMIN_PASSWORD", overrides.ADMIN_PASSWORD);
  setEnv("ADMIN_SESSION_SECRET", overrides.ADMIN_SESSION_SECRET);
  setEnv("JWT_SECRET", overrides.JWT_SECRET);
  return import("./admin-auth");
}

afterEach(() => {
  vi.resetModules();
  setEnv("NODE_ENV", ORIGINAL_NODE_ENV);
  setEnv("ADMIN_USERNAME", ORIGINAL_ADMIN_USERNAME);
  setEnv("ADMIN_PASSWORD", ORIGINAL_ADMIN_PASSWORD);
  setEnv("ADMIN_SESSION_SECRET", ORIGINAL_ADMIN_SESSION_SECRET);
  setEnv("JWT_SECRET", ORIGINAL_JWT_SECRET);
});

describe("admin-auth", () => {
  it("er ikke konfigurert uten admin-passord", async () => {
    const adminAuth = await loadAdminAuth({ ADMIN_PASSWORD: undefined, ADMIN_SESSION_SECRET: "secret" });

    expect(adminAuth.isAdminConfigured()).toBe(false);
    expect(adminAuth.validateAdminCredentials("admin", "secret")).toBe(false);
  });

  it("validerer credentials og trimmer brukernavn", async () => {
    const adminAuth = await loadAdminAuth({
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "veldig-hemmelig",
      ADMIN_SESSION_SECRET: "secret",
    });

    expect(adminAuth.validateAdminCredentials(" admin ", "veldig-hemmelig")).toBe(true);
    expect(adminAuth.validateAdminCredentials("admin", "feil")).toBe(false);
  });

  it("lager og verifiserer admin-session tokens", async () => {
    const adminAuth = await loadAdminAuth({ ADMIN_PASSWORD: "veldig-hemmelig", ADMIN_SESSION_SECRET: "secret" });

    const token = adminAuth.createAdminSessionToken("admin");

    expect(adminAuth.verifyAdminSessionToken(token)).toMatchObject({ role: "admin", username: "admin" });
    expect(adminAuth.verifyAdminSessionToken("ugyldig")).toBeNull();
  });

  it("leser admin-session fra cookie-header", async () => {
    const adminAuth = await loadAdminAuth({ ADMIN_PASSWORD: "veldig-hemmelig", ADMIN_SESSION_SECRET: "secret" });
    const token = adminAuth.createAdminSessionToken("admin");

    expect(
      adminAuth.getAdminSessionFromCookieHeader(`foo=bar; ${adminAuth.ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`),
    ).toMatchObject({ role: "admin", username: "admin" });
  });

  it("setter sikre cookie-flagg i production", async () => {
    const adminAuth = await loadAdminAuth({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "veldig-hemmelig",
      ADMIN_SESSION_SECRET: "secret",
    });

    expect(adminAuth.createAdminSessionCookie("token")).toContain("HttpOnly");
    expect(adminAuth.createAdminSessionCookie("token")).toContain("Secure");
    expect(adminAuth.clearAdminSessionCookie()).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(adminAuth.clearAdminSessionCookie()).toContain("Secure");
  });
});