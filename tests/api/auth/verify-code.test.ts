import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { parsePurposeMock, verifyCodeMock } = vi.hoisted(() => ({
  parsePurposeMock: vi.fn(),
  verifyCodeMock: vi.fn(),
}));

vi.mock("../../../lib/sms-auth", () => ({
  parseSmsVerificationPurpose: parsePurposeMock,
  verifySmsVerificationCode: verifyCodeMock,
}));

import handler from "../../../pages/api/auth/verify-code";

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
  parsePurposeMock.mockReturnValue("login");
  verifyCodeMock.mockResolvedValue({ ok: true, normalizedPhone: "+4790000001" });
});

describe("POST /api/auth/verify-code", () => {
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
    expect(res.body).toEqual({ error: "Telefonnummer og kode er påkrevd." });
  });

  it("returnerer 400 når formålet er ugyldig", async () => {
    parsePurposeMock.mockReturnValue(null);
    const req = { method: "POST", body: { phone: "90000001", purpose: "other", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Ugyldig formål for SMS-koden." });
  });

  it("returnerer 400 når kodeverifisering feiler", async () => {
    verifyCodeMock.mockResolvedValue({ ok: false, error: "Feil kode." });
    const req = { method: "POST", body: { phone: "90000001", purpose: "login", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Feil kode." });
  });

  it("returnerer 200 ved gyldig kode", async () => {
    const req = { method: "POST", body: { phone: "90000001", purpose: "login", code: "123456" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(verifyCodeMock).toHaveBeenCalledWith("90000001", "login", "123456");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, normalizedPhone: "+4790000001" });
  });
});