import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginUserMock, verifyCodeMock } = vi.hoisted(() => ({
  loginUserMock: vi.fn(),
  verifyCodeMock: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({ loginUser: loginUserMock }));
vi.mock("../../lib/sms-auth", () => ({ verifySmsVerificationCode: verifyCodeMock }));

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
  verifyCodeMock.mockResolvedValue({ ok: true, normalizedPhone: "+4790000001" });
  loginUserMock.mockResolvedValue({ token: "jwt-token", user: { id: 1, name: "Ada", phone: "+4790000001" } });
});

describe("POST /api/login", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 400 når telefon eller kode mangler", async () => {
    const req = { method: "POST", body: { phone: "", code: "" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Telefonnummer og SMS-kode er påkrevd." });
  });

  it("returnerer 400 når SMS-koden ikke verifiseres", async () => {
    verifyCodeMock.mockResolvedValue({ ok: false, error: "Feil kode." });
    const req = { method: "POST", body: { phone: "90000001", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Feil kode." });
  });

  it("returnerer 404 når bruker ikke finnes etter verifisert kode", async () => {
    loginUserMock.mockResolvedValue(null);
    const req = { method: "POST", body: { phone: "90000001", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Fant ingen konto for dette telefonnummeret." });
  });

  it("returnerer token og bruker ved gyldig innlogging", async () => {
    const req = { method: "POST", body: { phone: "90000001", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(verifyCodeMock).toHaveBeenCalledWith("90000001", "login", "123456");
    expect(loginUserMock).toHaveBeenCalledWith("+4790000001");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ token: "jwt-token", user: { id: 1, name: "Ada", phone: "+4790000001" } });
  });
});