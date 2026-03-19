import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { doesUserExistMock, normalizePhoneNumberMock, parsePurposeMock, requestCodeMock } = vi.hoisted(() => ({
  doesUserExistMock: vi.fn(),
  normalizePhoneNumberMock: vi.fn(),
  parsePurposeMock: vi.fn(),
  requestCodeMock: vi.fn(),
}));

vi.mock("../../../lib/auth", () => ({ doesUserExist: doesUserExistMock }));
vi.mock("../../../lib/phone", () => ({ normalizePhoneNumber: normalizePhoneNumberMock }));
vi.mock("../../../lib/sms-auth", () => ({
  parseSmsVerificationPurpose: parsePurposeMock,
  requestSmsVerificationCode: requestCodeMock,
}));

import handler from "../../../pages/api/auth/request-code";

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
  normalizePhoneNumberMock.mockReturnValue("+4790000001");
  parsePurposeMock.mockReturnValue("login");
});

describe("POST /api/auth/request-code", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 404 når login mangler konto", async () => {
    doesUserExistMock.mockResolvedValue(false);

    const req = { method: "POST", body: { phone: "90000001", purpose: "login" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Fant ingen konto for dette telefonnummeret." });
  });

  it("returnerer 409 når registrering allerede finnes", async () => {
    parsePurposeMock.mockReturnValue("register");
    doesUserExistMock.mockResolvedValue(true);

    const req = { method: "POST", body: { phone: "90000001", purpose: "register" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Dette telefonnummeret har allerede en konto." });
  });

  it("returnerer 202 og serialiserer expiresAt ved suksess", async () => {
    const expiresAt = new Date("2026-03-19T20:00:00.000Z");
    doesUserExistMock.mockResolvedValue(false);
    parsePurposeMock.mockReturnValue("register");
    requestCodeMock.mockResolvedValue({ devCode: "123456", expiresAt, normalizedPhone: "+4790000001" });

    const req = { method: "POST", body: { phone: "90000001", purpose: "register" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(202);
    expect(res.body).toEqual({
      ok: true,
      normalizedPhone: "+4790000001",
      expiresAt: "2026-03-19T20:00:00.000Z",
      devCode: "123456",
    });
  });

  it("returnerer 429 ved rate limiting", async () => {
    doesUserExistMock.mockResolvedValue(false);
    parsePurposeMock.mockReturnValue("register");

    const error = new Error("For mange SMS-kodeforespørsler. Vent litt og prøv igjen.");
    error.name = "SmsRateLimitError";
    requestCodeMock.mockRejectedValue(error);

    const req = { method: "POST", body: { phone: "90000001", purpose: "register" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: "For mange SMS-kodeforespørsler. Vent litt og prøv igjen." });
  });

  it("returnerer 503 når SMS-oppsettet ikke er klart for production", async () => {
    doesUserExistMock.mockResolvedValue(false);
    parsePurposeMock.mockReturnValue("register");

    const error = new Error("SMS_PROVIDER=mock kan ikke brukes i production.");
    error.name = "SmsConfigurationError";
    requestCodeMock.mockRejectedValue(error);

    const req = { method: "POST", body: { phone: "90000001", purpose: "register" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: "SMS_PROVIDER=mock kan ikke brukes i production." });
  });
});