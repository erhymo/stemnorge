import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    issue: {
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    vote: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/content", () => ({
  currentIssue: {
    slug: "dagens-sak",
    title: "Dagens sak",
    question: "Skal noe skje?",
    periodLabel: "Denne uken",
    overview: "Oversikt",
    background: "Bakgrunn",
    argumentFor: "For",
    argumentAgainst: "Mot",
    resultSummary: "Resultat",
    supportLabel: "For",
    opposeLabel: "Mot",
    supportPercent: 51,
    opposePercent: 49,
    sources: [],
  },
  historicalIssues: [],
}));

import { deletePlannedIssue, updatePlannedIssue } from "./issues";

function createIssueRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 7,
    slug: "framtidig-sak",
    title: "Fremtidig sak",
    question: "Skal vi teste dette?",
    periodLabel: "Publisert 01.01.2030 · Resultat 07.01.2030",
    overview: "Oversikt",
    background: "Bakgrunn",
    argumentFor: "For",
    argumentAgainst: "Mot",
    resultSummary: null,
    supportLabel: "For",
    opposeLabel: "Mot",
    publishedSupportPercent: null,
    publishedOpposePercent: null,
    sourcesJson: "[]",
    publishedAt: new Date("2030-01-01T06:00:00.000Z"),
    closesAt: new Date("2030-01-07T18:00:00.000Z"),
    createdAt: new Date("2029-12-20T00:00:00.000Z"),
    updatedAt: new Date("2029-12-20T00:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.issue.upsert.mockResolvedValue({});
});

describe("issue mutations", () => {
  it("oppdaterer en planlagt sak og ekskluderer seg selv fra overlappssjekken", async () => {
    const existingIssue = createIssueRecord();
    prismaMock.issue.findUnique.mockResolvedValueOnce(existingIssue).mockResolvedValueOnce(existingIssue);
    prismaMock.issue.findFirst.mockResolvedValue(null);
    prismaMock.issue.update.mockResolvedValue({ id: 7, slug: "framtidig-sak" });

    const result = await updatePlannedIssue(
      7,
      {
        slug: "framtidig-sak",
        title: " Oppdatert sak ",
        question: " Skal vi teste mer? ",
        overview: " Ny oversikt ",
        background: " Ny bakgrunn ",
        argumentFor: " Ja ",
        argumentAgainst: " Nei ",
        supportLabel: "Støtt",
        opposeLabel: "Stopp",
        publishedAt: new Date("2030-01-08T06:00:00.000Z"),
        closesAt: new Date("2030-01-14T18:00:00.000Z"),
      },
      new Date("2030-01-01T00:00:00.000Z"),
    );

    expect(prismaMock.issue.findFirst).toHaveBeenCalledWith({
      where: {
        slug: { notIn: ["legacy-prototype-import"] },
        id: { not: 7 },
        publishedAt: { lt: new Date("2030-01-14T18:00:00.000Z") },
        closesAt: { gt: new Date("2030-01-08T06:00:00.000Z") },
      },
      orderBy: { publishedAt: "asc" },
    });
    expect(prismaMock.issue.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        title: "Oppdatert sak",
        question: "Skal vi teste mer?",
        overview: "Ny oversikt",
        background: "Ny bakgrunn",
        argumentFor: "Ja",
        argumentAgainst: "Nei",
        supportLabel: "Støtt",
        opposeLabel: "Stopp",
        periodLabel: expect.any(String),
      }),
    });
    expect(result).toEqual({ id: 7, slug: "framtidig-sak" });
  });

  it("avviser redigering av en sak som allerede er publisert", async () => {
    prismaMock.issue.findUnique.mockResolvedValue(
      createIssueRecord({
        slug: "aktiv-sak",
        publishedAt: new Date("2030-01-01T06:00:00.000Z"),
        closesAt: new Date("2030-01-07T18:00:00.000Z"),
      }),
    );

    await expect(
      updatePlannedIssue(
        7,
        {
          slug: "aktiv-sak",
          title: "Aktiv sak",
          question: "Skal vi endre aktiv sak?",
          overview: "Oversikt",
          background: "Bakgrunn",
          argumentFor: "For",
          argumentAgainst: "Mot",
          supportLabel: "For",
          opposeLabel: "Mot",
          publishedAt: new Date("2030-01-01T06:00:00.000Z"),
          closesAt: new Date("2030-01-07T18:00:00.000Z"),
        },
        new Date("2030-01-02T00:00:00.000Z"),
      ),
    ).rejects.toThrow("Bare planlagte saker kan redigeres eller slettes.");
  });

  it("sletter en planlagt sak", async () => {
    prismaMock.issue.findUnique.mockResolvedValue(createIssueRecord());
    prismaMock.issue.delete.mockResolvedValue({ id: 7, slug: "framtidig-sak" });

    const result = await deletePlannedIssue(7, new Date("2030-01-01T00:00:00.000Z"));

    expect(prismaMock.issue.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result).toEqual({ id: 7, slug: "framtidig-sak" });
  });
});