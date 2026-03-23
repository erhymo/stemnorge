import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginUserMock } = vi.hoisted(() => ({
  loginUserMock: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({ loginUser: loginUserMock }));

import handler from "../../pages/api/login";

function createResponse() {
  const response = {
    body: undefined as unknown,
    ended: false,
    statusCode: 200,
    end() {
      this.ended = true;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
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
  loginUserMock.mockResolvedValue({ verified: true, token: "jwt-token", user: { id: 1, name: "Ada", email: "ada@test.no" } });
});

describe("POST /api/login", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 400 når e-post eller passord mangler", async () => {
    const req = { method: "POST", body: { email: "", password: "" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "E-post og passord er påkrevd." });
  });

  it("returnerer 401 ved feil e-post eller passord", async () => {
    loginUserMock.mockResolvedValue(null);
    const req = { method: "POST", body: { email: "ada@test.no", password: "feilpassord" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Feil e-postadresse eller passord." });
  });

  it("returnerer token og bruker ved gyldig innlogging", async () => {
    const req = { method: "POST", body: { email: "ada@test.no", password: "hemmelighet1" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(loginUserMock).toHaveBeenCalledWith("ada@test.no", "hemmelighet1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ token: "jwt-token", user: { id: 1, name: "Ada", email: "ada@test.no" } });
  });

  it("returnerer 403 for uverifisert e-post", async () => {
    loginUserMock.mockResolvedValue({ verified: false });
    const req = { method: "POST", body: { email: "ada@test.no", password: "hemmelighet1" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual(expect.objectContaining({ code: "EMAIL_NOT_VERIFIED" }));
  });
});