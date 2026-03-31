import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAgendaTipMock, isAgendaTipValidationErrorMock } = vi.hoisted(() => ({
  createAgendaTipMock: vi.fn(),
  isAgendaTipValidationErrorMock: vi.fn(),
}));

vi.mock("../../lib/tips", () => ({
  createAgendaTip: createAgendaTipMock,
  isAgendaTipValidationError: isAgendaTipValidationErrorMock,
}));

import handler from "../../pages/api/tips";

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
    setHeader() {
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
  createAgendaTipMock.mockResolvedValue({ id: 1 });
  isAgendaTipValidationErrorMock.mockReturnValue(true);
});

describe("POST /api/tips", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("lagrer tips ved gyldig POST", async () => {
    const req = { method: "POST", body: { message: "Vi bør diskutere kollektivprisene." } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(createAgendaTipMock).toHaveBeenCalledWith({ message: "Vi bør diskutere kollektivprisene." });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ ok: true });
  });

  it("returnerer 400 ved valideringsfeil", async () => {
    createAgendaTipMock.mockRejectedValue(new Error("Tipset må være minst 10 tegn langt."));

    const req = { method: "POST", body: { message: "kort" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(isAgendaTipValidationErrorMock).toHaveBeenCalledWith("Tipset må være minst 10 tegn langt.");
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Tipset må være minst 10 tegn langt." });
  });
});