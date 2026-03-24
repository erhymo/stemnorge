import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { registerUserMock } = vi.hoisted(() => ({
  registerUserMock: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({ registerUser: registerUserMock }));

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
    setHeader(_name: string, _value: string | string[]) {
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
  registerUserMock.mockResolvedValue({ token: "jwt-token", user: { id: 1, name: "Ada", email: "ada@test.no" } });
});

describe("POST /api/register", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 400 når navn, e-post eller passord mangler", async () => {
    const req = { method: "POST", body: { email: "", password: "", name: "" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Navn, e-post og passord er påkrevd." });
  });

  it("returnerer 409 når e-posten allerede har konto", async () => {
    registerUserMock.mockRejectedValue(new Error("Denne e-postadressen har allerede en konto."));
    const req = { method: "POST", body: { email: "ada@test.no", password: "hemmelighet1", name: "Ada" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Denne e-postadressen har allerede en konto." });
  });

  it("returnerer 201 ved gyldig registrering", async () => {
    const req = { method: "POST", body: { email: "ada@test.no", password: "hemmelighet1", name: "Ada" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(registerUserMock).toHaveBeenCalledWith("ada@test.no", "hemmelighet1", "Ada");
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ token: "jwt-token", user: { id: 1, name: "Ada", email: "ada@test.no" } });
  });
});