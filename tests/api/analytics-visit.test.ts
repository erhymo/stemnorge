import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordSiteVisitMock } = vi.hoisted(() => ({
  recordSiteVisitMock: vi.fn(),
}));

vi.mock("../../lib/site-analytics", () => ({ recordSiteVisit: recordSiteVisitMock }));

import handler from "../../pages/api/analytics/visit";

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
  recordSiteVisitMock.mockResolvedValue({ id: 1, pathname: "/", createdAt: new Date() });
});

describe("POST /api/analytics/visit", () => {
  it("returnerer 405 for andre HTTP-metoder", async () => {
    const req = { method: "GET" } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { ended: boolean; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.ended).toBe(true);
  });

  it("hopper over admin-stier", async () => {
    const req = { method: "POST", body: { pathname: "/admin" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, skipped: true });
    expect(recordSiteVisitMock).not.toHaveBeenCalled();
  });

  it("lagrer besøk på offentlige sider", async () => {
    const req = { method: "POST", body: { pathname: "/vote" } } as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ ok: true });
    expect(recordSiteVisitMock).toHaveBeenCalledWith("/vote");
  });
});