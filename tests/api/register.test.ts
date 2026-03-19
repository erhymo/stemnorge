import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { registerUserMock, verifyCodeMock } = vi.hoisted(() => ({
  registerUserMock: vi.fn(),
  verifyCodeMock: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({ registerUser: registerUserMock }));
vi.mock("../../lib/sms-auth", () => ({ verifySmsVerificationCode: verifyCodeMock }));

import handler from "../../pages/api/register";

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
  registerUserMock.mockResolvedValue({ token: "jwt-token", user: { id: 1, name: "Ada", phone: "+4790000001" } });
});

describe("POST /api/register", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 400 når navn, telefon eller kode mangler", async () => {
    const req = { method: "POST", body: { phone: "", code: "", name: "" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Navn, telefonnummer og SMS-kode er påkrevd." });
  });

  it("returnerer 400 når SMS-koden ikke verifiseres", async () => {
    verifyCodeMock.mockResolvedValue({ ok: false, error: "Feil kode." });
    const req = { method: "POST", body: { phone: "90000001", code: "123456", name: "Ada" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Feil kode." });
  });

  it("returnerer 409 når telefonnummeret allerede har konto", async () => {
    registerUserMock.mockRejectedValue(new Error("Dette telefonnummeret har allerede en konto."));
    const req = { method: "POST", body: { phone: "90000001", code: "123456", name: "Ada" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Dette telefonnummeret har allerede en konto." });
  });

  it("returnerer 201 ved gyldig registrering", async () => {
    const req = { method: "POST", body: { phone: "90000001", code: "123456", name: "Ada" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(verifyCodeMock).toHaveBeenCalledWith("90000001", "register", "123456");
    expect(registerUserMock).toHaveBeenCalledWith("+4790000001", "Ada");
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ token: "jwt-token", user: { id: 1, name: "Ada", phone: "+4790000001" } });
  });
});