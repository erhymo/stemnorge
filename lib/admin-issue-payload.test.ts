import { describe, expect, it } from "vitest";

import { parseAdminIssueInput } from "./admin-issue-payload";

describe("parseAdminIssueInput", () => {
  it("tolker datetime-local som norsk tid", () => {
    const input = parseAdminIssueInput({
      title: "Ny sak",
      slug: "ny-sak",
      question: "Bør dette skje?",
      overview: "Oversikt",
      background: "Bakgrunn",
      argumentFor: "For",
      argumentAgainst: "Mot",
      supportLabel: "For",
      opposeLabel: "Mot",
      publishedAt: "2026-04-20T06:00",
      closesAt: "2026-04-26T18:00",
    });

    expect(input?.publishedAt.toISOString()).toBe("2026-04-20T04:00:00.000Z");
    expect(input?.closesAt.toISOString()).toBe("2026-04-26T16:00:00.000Z");
  });
});