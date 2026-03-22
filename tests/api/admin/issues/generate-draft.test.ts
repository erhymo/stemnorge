import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSessionMock, generateAdminIssueDraftMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  generateAdminIssueDraftMock: vi.fn(),
}));

vi.mock("../../../../lib/admin-auth", () => ({ getAdminSessionFromCookieHeader: getAdminSessionMock }));
vi.mock("../../../../lib/admin-issue-draft", () => ({ generateAdminIssueDraft: generateAdminIssueDraftMock }));

import handler from "../../../../pages/api/admin/issues/generate-draft";

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
  getAdminSessionMock.mockReturnValue({ role: "admin", username: "admin" });
  generateAdminIssueDraftMock.mockResolvedValue({
    source: "openai",
    draft: {
      slug: "framtidig-sak",
      title: "Fremtidig sak",
      question: "Bør Norge prioritere dette?",
      overview: "Oversikt",
      background: "Bakgrunn",
      argumentFor: "For",
      argumentAgainst: "Mot",
      supportLabel: "For",
      opposeLabel: "Mot",
    },
  });
});

describe("/api/admin/issues/generate-draft", () => {
  it("returnerer 405 for andre metoder", async () => {
    const req = { method: "GET", headers: {} } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("returnerer 401 uten admin-session", async () => {
    getAdminSessionMock.mockReturnValue(null);

    const req = { method: "POST", headers: {}, body: { topic: "Ny sak" } } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Admin-innlogging kreves for å generere utkast." });
  });

  it("returnerer 400 når tema mangler", async () => {
    const req = { method: "POST", headers: {}, body: { topic: "   " } } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Tema er påkrevd for å generere et utkast." });
  });

  it("returnerer generert utkast ved gyldig POST", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { topic: "Atomkraft i Norge", context: "Vurder kostnader" },
    } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(generateAdminIssueDraftMock).toHaveBeenCalledWith({
      topic: "Atomkraft i Norge",
      context: "Vurder kostnader",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      source: "openai",
      draft: expect.objectContaining({ slug: "framtidig-sak", title: "Fremtidig sak" }),
    });
  });
});