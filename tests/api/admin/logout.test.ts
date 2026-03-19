import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearAdminSessionCookieMock } = vi.hoisted(() => ({
  clearAdminSessionCookieMock: vi.fn(),
}));

vi.mock("../../../lib/admin-auth", () => ({
  clearAdminSessionCookie: clearAdminSessionCookieMock,
}));

import handler from "../../../pages/api/admin/logout";

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
  clearAdminSessionCookieMock.mockReturnValue("stemnorge_admin_session=; Max-Age=0");
});

describe("POST /api/admin/logout", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("tømmer admin-cookie og returnerer ok", async () => {
    const req = { method: "POST" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & {
      body: unknown;
      headers: Record<string, unknown>;
      statusCode: number;
    };

    await handler(req, res);

    expect(res.headers["Set-Cookie"]).toBe("stemnorge_admin_session=; Max-Age=0");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});