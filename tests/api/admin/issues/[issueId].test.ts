import type { NextApiRequest, NextApiResponse } from "next";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSessionMock, parseAdminIssueInputMock, updatePlannedIssueMock, deletePlannedIssueMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  parseAdminIssueInputMock: vi.fn(),
  updatePlannedIssueMock: vi.fn(),
  deletePlannedIssueMock: vi.fn(),
}));

vi.mock("../../../../lib/admin-auth", () => ({ getAdminSessionFromCookieHeader: getAdminSessionMock, verifyCsrfOrigin: () => true }));
vi.mock("../../../../lib/admin-issue-payload", () => ({
  getAdminIssueMutationErrorStatus: (message: string) => (message.includes("Bare planlagte") ? 409 : 400),
  parseAdminIssueInput: parseAdminIssueInputMock,
}));
vi.mock("../../../../lib/issues", () => ({
  deletePlannedIssue: deletePlannedIssueMock,
  updatePlannedIssue: updatePlannedIssueMock,
}));

import handler from "../../../../pages/api/admin/issues/[issueId]";

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
  parseAdminIssueInputMock.mockReturnValue({
    slug: "framtidig-sak",
    title: "Fremtidig sak",
    question: "Skal vi teste?",
    overview: "Oversikt",
    background: "Bakgrunn",
    argumentFor: "For",
    argumentAgainst: "Mot",
    supportLabel: "For",
    opposeLabel: "Mot",
    publishedAt: new Date("2030-01-01T06:00:00.000Z"),
    closesAt: new Date("2030-01-07T18:00:00.000Z"),
  });
});

describe("/api/admin/issues/[issueId]", () => {
  it("returnerer 401 uten admin-session", async () => {
    getAdminSessionMock.mockReturnValue(null);

    const req = { method: "DELETE", headers: {}, query: { issueId: "7" } } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Admin-innlogging kreves for å endre planlagte saker." });
  });

  it("returnerer 400 for ugyldig saks-ID", async () => {
    const req = { method: "PATCH", headers: {}, query: { issueId: "abc" }, body: {} } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Ugyldig saks-ID." });
  });

  it("oppdaterer en planlagt sak via PATCH", async () => {
    updatePlannedIssueMock.mockResolvedValue({ id: 7, slug: "framtidig-sak" });

    const req = { method: "PATCH", headers: {}, query: { issueId: "7" }, body: { title: "Ny" } } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(updatePlannedIssueMock).toHaveBeenCalledWith(7, expect.objectContaining({ slug: "framtidig-sak" }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ issue: { id: 7, slug: "framtidig-sak" } });
  });

  it("sletter en planlagt sak via DELETE", async () => {
    deletePlannedIssueMock.mockResolvedValue({ id: 7, slug: "framtidig-sak" });

    const req = { method: "DELETE", headers: {}, query: { issueId: "7" } } as unknown as NextApiRequest;
    const res = createResponse() as NextApiResponse & { body: unknown; statusCode: number };

    await handler(req, res);

    expect(deletePlannedIssueMock).toHaveBeenCalledWith(7);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, issue: { id: 7, slug: "framtidig-sak" } });
  });
});