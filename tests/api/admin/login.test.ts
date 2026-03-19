import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSessionCookieMock, createAdminSessionTokenMock, isAdminConfiguredMock, validateAdminCredentialsMock } = vi.hoisted(() => ({
  createAdminSessionCookieMock: vi.fn(),
  createAdminSessionTokenMock: vi.fn(),
  isAdminConfiguredMock: vi.fn(),
  validateAdminCredentialsMock: vi.fn(),
}));

vi.mock("../../../lib/admin-auth", () => ({
  createAdminSessionCookie: createAdminSessionCookieMock,
  createAdminSessionToken: createAdminSessionTokenMock,
  isAdminConfigured: isAdminConfiguredMock,
  validateAdminCredentials: validateAdminCredentialsMock,
}));

import handler from "../../../pages/api/admin/login";

function createResponse() {
  const response = {
    body: undefined as unknown,
    ended: false,
    headers: {} as Record<string, unknown>,
    statusCode: 200,
    end() {
      this.ended = true;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: unknown) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };

  return response as unknown as NextApiResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
  isAdminConfiguredMock.mockReturnValue(true);
  validateAdminCredentialsMock.mockReturnValue(true);
  createAdminSessionTokenMock.mockReturnValue("signed-admin-token");
  createAdminSessionCookieMock.mockReturnValue("stemnorge_admin_session=signed-admin-token");
});

describe("POST /api/admin/login", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 503 når admin ikke er konfigurert", async () => {
    isAdminConfiguredMock.mockReturnValue(false);
    const req = { method: "POST", body: { username: "admin", password: "pw" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: "Admin-innlogging er ikke konfigurert i miljøet." });
  });

  it("returnerer 400 når brukernavn eller passord mangler", async () => {
    const req = { method: "POST", body: { username: "", password: "" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Brukernavn og admin-passord er påkrevd." });
  });

  it("returnerer 401 ved ugyldig admin-innlogging", async () => {
    validateAdminCredentialsMock.mockReturnValue(false);
    const req = { method: "POST", body: { username: "admin", password: "feil" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Ugyldig admin-innlogging." });
  });

  it("setter admin-cookie og returnerer ok ved gyldig innlogging", async () => {
    const req = { method: "POST", body: { username: "admin", password: "pw" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & {
      body: unknown;
      headers: Record<string, unknown>;
      statusCode: number;
    };

    await handler(req, res);

    expect(createAdminSessionTokenMock).toHaveBeenCalledWith("admin");
    expect(res.headers["Set-Cookie"]).toBe("stemnorge_admin_session=signed-admin-token");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});