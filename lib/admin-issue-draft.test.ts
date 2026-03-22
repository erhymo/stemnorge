import { afterEach, describe, expect, it, vi } from "vitest";

import { generateAdminIssueDraft, generateLocalAdminIssueDraft, toAdminIssueSlug } from "./admin-issue-draft";

const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;

afterEach(() => {
  process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_API_KEY;
  vi.restoreAllMocks();
});

describe("admin issue draft", () => {
  it("normaliserer norske tegn når sluggen bygges", () => {
    expect(toAdminIssueSlug(" Økt strømstøtte nå! ")).toBe("okt-stromstotte-na");
  });

  it("genererer et førsteutkast fra tema og kontekst lokalt", () => {
    const draft = generateLocalAdminIssueDraft({
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
    expect(draft.background).toContain("\n\n");
    expect(draft.argumentFor).toContain("Vurder forsyningssikkerhet og kostnader.");
    expect(draft.background.length).toBeGreaterThanOrEqual(280);
    expect(draft.argumentFor.length).toBeGreaterThanOrEqual(220);
    expect(draft.argumentAgainst.length).toBeGreaterThanOrEqual(220);
  });

  it("beholder ferdig formulert spørsmål", () => {
    const draft = generateLocalAdminIssueDraft({ topic: "Skal Norge forby anonyme kontoer?" });

    expect(draft.question).toBe("Skal Norge forby anonyme kontoer?");
  });

  it("faller tilbake til lokal generator når OPENAI_API_KEY mangler", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateAdminIssueDraft({ topic: "Mer havvind i Norge" });

    expect(result.source).toBe("fallback");
    expect(result.draft.title).toBe("Mer havvind i Norge");
  });

  it("bruker OpenAI når nøkkel finnes og svar kan parses", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Atomkraft som norsk energivalg",
                  question: "Bør Norge satse mer på atomkraft?",
                  overview: "Dette er en kort oversikt.",
                  background:
                    "Atomkraft diskuteres ofte som et svar på behovet for mer stabil energiforsyning. Tilhengere peker gjerne på at teknologien kan produsere store mengder strøm over lang tid. Samtidig krever utbygging store investeringer og lange løp.\n\nSpørsmålet handler derfor ikke bare om teknologi, men om prioriteringer, risiko og tempo i energipolitikken. Det er også relevant å vurdere hvordan nye investeringer vil påvirke andre tiltak som allerede er planlagt.",
                  argumentFor:
                    "Tilhengere kan mene at atomkraft gir et mer stabilt kraftgrunnlag enn væruavhengige alternativer alene. De kan hevde at dette styrker forsyningssikkerheten og gjør energisystemet mindre sårbart.\n\nNoen vil også mene at tydelige investeringer i ny produksjon kan gi mer langsiktighet for industri og lokalsamfunn. Dersom behovet for strøm vokser raskt, kan de se atomkraft som et viktig supplement i den samlede energimiksen.",
                  argumentAgainst:
                    "Motstandere kan mene at atomkraft tar for lang tid til å løse mer akutte utfordringer i kraftsystemet. De kan også være skeptiske til kostnadsnivået og usikkerheten som følger store, komplekse prosjekter.\n\nAndre vil hevde at det er klokere å bruke ressursene på løsninger som kan bygges ut raskere eller billigere. De kan derfor mene at alternativkostnaden blir for høy dersom politisk oppmerksomhet bindes opp i én stor satsing.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await generateAdminIssueDraft({ topic: "Atomkraft i Norge" });

    expect(result.source).toBe("openai");
    expect(result.draft).toEqual(
      expect.objectContaining({
        slug: "atomkraft-som-norsk-energivalg",
        title: "Atomkraft som norsk energivalg",
        question: "Bør Norge satse mer på atomkraft?",
      }),
    );
    expect(result.draft.background).toContain("\n\n");
  });

  it("faller tilbake til lokalt langt innhold når OpenAI-feltene blir for korte", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Kort utkast",
                  question: "Bør Norge teste dette?",
                  overview: "Kort oversikt.",
                  background: "For kort.",
                  argumentFor: "For kort.",
                  argumentAgainst: "For kort.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await generateAdminIssueDraft({ topic: "Atomkraft i Norge" });

    expect(result.source).toBe("openai");
    expect(result.draft.overview.length).toBeGreaterThanOrEqual(80);
    expect(result.draft.background.length).toBeGreaterThanOrEqual(280);
    expect(result.draft.argumentFor.length).toBeGreaterThanOrEqual(220);
    expect(result.draft.argumentAgainst.length).toBeGreaterThanOrEqual(220);
  });
});