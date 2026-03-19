import { describe, expect, it } from "vitest";

import { generateAdminIssueDraft, toAdminIssueSlug } from "./admin-issue-draft";

describe("admin issue draft", () => {
  it("normaliserer norske tegn når sluggen bygges", () => {
    expect(toAdminIssueSlug(" Økt strømstøtte nå! ")).toBe("okt-stromstotte-na");
  });

  it("genererer et førsteutkast fra tema og kontekst", () => {
    const draft = generateAdminIssueDraft({
      topic: "Atomkraft i Norge",
      context: "Vurder forsyningssikkerhet og kostnader",
    });

    expect(draft).toEqual(
      expect.objectContaining({
        slug: "atomkraft-i-norge",
        title: "Atomkraft i Norge",
        question: "Bør Norge prioritere atomkraft?",
        supportLabel: "For",
        opposeLabel: "Mot",
      }),
    );
    expect(draft.overview).toContain("Denne saken handler om atomkraft i Norge.");
    expect(draft.argumentFor).toContain("Vurder forsyningssikkerhet og kostnader.");
  });

  it("beholder ferdig formulert spørsmål", () => {
    const draft = generateAdminIssueDraft({ topic: "Skal Norge forby anonyme kontoer?" });

    expect(draft.question).toBe("Skal Norge forby anonyme kontoer?");
  });
});