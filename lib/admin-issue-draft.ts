import type { CreateIssueInput } from "@/lib/issues";

import { getOpenAiApiKey, getOpenAiModel } from "@/lib/env";
import {
  ISSUE_ARGUMENT_MIN_LENGTH,
  ISSUE_BACKGROUND_MIN_LENGTH,
  ISSUE_OVERVIEW_MIN_LENGTH,
} from "@/lib/issue-text-guidelines";

export type AdminIssueDraft = Pick<
  CreateIssueInput,
  "slug" | "title" | "question" | "overview" | "background" | "argumentFor" | "argumentAgainst" | "supportLabel" | "opposeLabel"
>;

export type GenerateAdminIssueDraftInput = {
  topic: string;
  context?: string;
};

export type DraftGenerationSource = "openai" | "fallback";

export type GeneratedAdminIssueDraft = {
  draft: AdminIssueDraft;
  source: DraftGenerationSource;
};

const NORWEGIAN_SLUG_REPLACEMENTS: Record<string, string> = {
  å: "a",
  Å: "a",
  æ: "ae",
  Æ: "ae",
  ø: "o",
  Ø: "o",
};

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeGeneratedParagraph(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeParagraphs(value: string) {
  return value
    .split(/\n\s*\n/g)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)
    .join("\n\n");
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "").trim();
}

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function lowerCaseFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function withTrailingSentencePunctuation(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function normalizeTopic(value: string) {
  return stripTrailingPunctuation(normalizeWhitespace(value));
}

function getQuestionFromTopic(topic: string) {
  if (/^(skal|bør)\b/i.test(topic)) {
    return topic.endsWith("?") ? capitalizeFirst(topic) : `${capitalizeFirst(topic)}?`;
  }

  const questionTopic = topic.replace(/\s+i\s+norge$/i, "").trim() || topic;
  return `Bør Norge prioritere ${lowerCaseFirst(questionTopic)}?`;
}

export function toAdminIssueSlug(value: string) {
  return normalizeTopic(value)
    .replace(/[åÅæÆøØ]/g, (character) => NORWEGIAN_SLUG_REPLACEMENTS[character] ?? character)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureQuestion(value: string, fallback: string) {
  const normalizedValue = normalizeWhitespace(value);

  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue.endsWith("?")) {
    return normalizedValue;
  }

  return `${stripTrailingPunctuation(normalizedValue)}?`;
}

function readGeneratedField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function ensureGeneratedSection(candidate: string, fallback: string, minLength: number) {
  const normalizedCandidate = normalizeParagraphs(normalizeGeneratedParagraph(candidate));
  return normalizedCandidate.length >= minLength ? normalizedCandidate : fallback;
}

function mergeGeneratedDraft(candidate: Record<string, unknown>, fallbackDraft: AdminIssueDraft): AdminIssueDraft {
  const title = normalizeWhitespace(readGeneratedField(candidate, "title")) || fallbackDraft.title;

  return {
    slug: toAdminIssueSlug(title) || fallbackDraft.slug,
    title,
    question: ensureQuestion(readGeneratedField(candidate, "question"), fallbackDraft.question),
    overview: ensureGeneratedSection(readGeneratedField(candidate, "overview"), fallbackDraft.overview, ISSUE_OVERVIEW_MIN_LENGTH),
    background: ensureGeneratedSection(readGeneratedField(candidate, "background"), fallbackDraft.background, ISSUE_BACKGROUND_MIN_LENGTH),
    argumentFor: ensureGeneratedSection(readGeneratedField(candidate, "argumentFor"), fallbackDraft.argumentFor, ISSUE_ARGUMENT_MIN_LENGTH),
    argumentAgainst: ensureGeneratedSection(readGeneratedField(candidate, "argumentAgainst"), fallbackDraft.argumentAgainst, ISSUE_ARGUMENT_MIN_LENGTH),
    supportLabel: fallbackDraft.supportLabel,
    opposeLabel: fallbackDraft.opposeLabel,
  };
}

async function requestOpenAiDraft(input: GenerateAdminIssueDraftInput, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Du lager førsteutkast til politiske saker for en norsk stemmeapp. Skriv på norsk bokmål.",
            "OBJEKTIVITET: Feltene overview og background skal være strengt objektive og nøytrale. Ikke ta stilling, ikke bruk ladede ord, og presenter alle sider likeverdig. Kun argumentFor og argumentAgainst skal være partiske.",
            "TALL OG STATISTIKK: Bruk konkrete, verifiserbare tall, prosenter og statistikk der det er relevant (f.eks. kostnader, antall berørte, tidsrammer, internasjonale sammenligninger). Referer til kjente offentlige kilder som SSB, Regjeringen, NOU-er eller internasjonale organisasjoner. Ikke finn på tall — bruk kun fakta du er sikker på.",
            "LENGDEKRAV: overview må være minst 150 tegn. background må være minst 800 tegn. argumentFor og argumentAgainst må hver være minst 400 tegn.",
            "Vær nøktern, balansert, konkret og pedagogisk. Målet er at leseren skal forstå hva saken handler om og kunne ta en informert stilling.",
            "Skriv overview som en informativ, objektiv ingress på 3-5 setninger. Skriv background i 4-6 avsnitt med faktisk kontekst, tall, historikk og nåværende situasjon — gjerne med internasjonale sammenligninger der det er relevant. Skriv argumentFor og argumentAgainst i 3-4 avsnitt hver med konkrete gevinster/risikoer.",
            "Returner kun gyldig JSON med feltene title, question, overview, background, argumentFor og argumentAgainst.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            topic: input.topic,
            context: input.context || "",
            requirements: {
              title: "Kort og tydelig tittel på norsk.",
              question: "Én nøytral spørsmålstekst som velgeren skal ta stilling til.",
              overview:
                "3-5 objektive setninger (minst 150 tegn) som forklarer hva saken gjelder, hvorfor temaet er relevant, og hvilke dimensjoner som gjør spørsmålet viktig. Bruk gjerne et konkret tall eller faktum som viser omfanget.",
              background:
                "4-6 avsnitt (minst 800 tegn) som objektivt forklarer bakgrunn, historikk, dagens situasjon og hvorfor saken diskuteres. Inkluder verifiserbare tall og statistikk der det er mulig (kostnader, antall berørte, tidslinjer, internasjonale sammenligninger). Referer til kjente offentlige kilder. Ikke ta stilling — forklar begge sider likeverdig.",
              argumentFor:
                "3-4 avsnitt (minst 400 tegn) som beskriver hvorfor noen støtter saken, med konkrete gevinster, tall og eksempler. Forklar hvilke problemer tilhengerne mener tiltaket løser.",
              argumentAgainst:
                "3-4 avsnitt (minst 400 tegn) som beskriver hvorfor noen er skeptiske, med konkrete risikoer, kostnader og eksempler. Forklar hvilke alternative løsninger motstanderne foretrekker.",
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI svarte med ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returnerte ikke noe innhold.");
  }

  const parsed = JSON.parse(content) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenAI returnerte ugyldig JSON-format.");
  }

  return parsed as Record<string, unknown>;
}

export function generateLocalAdminIssueDraft({ topic, context }: GenerateAdminIssueDraftInput): AdminIssueDraft {
  const normalizedTopic = normalizeTopic(topic);

  if (!normalizedTopic) {
    throw new Error("Tema er påkrevd for å generere et utkast.");
  }

  const normalizedContext = normalizeTopic(context ?? "");
  const topicLower = lowerCaseFirst(normalizedTopic);
  const contextSentence = normalizedContext ? ` ${withTrailingSentencePunctuation(capitalizeFirst(normalizedContext))}` : "";

  return {
    slug: toAdminIssueSlug(normalizedTopic),
    title: capitalizeFirst(normalizedTopic),
    question: getQuestionFromTopic(normalizedTopic),
    overview: normalizedContext
      ? `Denne saken handler om ${topicLower}. ${capitalizeFirst(normalizedContext)}. Utkastet bør gjøre det tydelig hva velgeren faktisk skal ta stilling til, og hvorfor temaet vekker politisk debatt.`
      : `Denne saken handler om ${topicLower}. Utkastet bør gjøre det tydelig hva velgerne faktisk skal ta stilling til, hvorfor temaet er relevant akkurat nå, og hvilke hensyn som gjør spørsmålet krevende.`,
    background: normalizedContext
      ? [
          `Saken om ${topicLower} handler ikke bare om et enkelt ja-eller-nei-spørsmål, men om hvilke mål samfunnet ønsker å prioritere og hvilke konsekvenser ulike valg kan få over tid. ${capitalizeFirst(topicLower)} kan berøre både økonomi, trygghet, rettferdighet og tillit, avhengig av hvordan tiltaket utformes.${contextSentence}`,
          `For velgeren er det derfor viktig å forstå hva dagens situasjon er, hvilke problemer tilhengerne mener må løses, og hvilke avveininger som følger med. Et godt bakteppe bør gjøre det lettere å se hvorfor saken engasjerer og hvorfor flere hensyn kan trekke i ulike retninger.`,
          `Historisk sett har lignende spørsmål blitt diskutert i Norge og andre land, ofte med ulike utfall avhengig av politisk kontekst, økonomiske rammer og samfunnets prioriteringer på det aktuelle tidspunktet. Erfaringer fra andre land kan gi nyttig innsikt, men må alltid vurderes opp mot norske forhold og verdier.`,
          `Når temaet vurderes, er det også naturlig å spørre hvem som blir mest berørt, hvor raskt eventuelle effekter kan komme, og om et nytt tiltak vil fungere bedre enn å justere det som allerede finnes i dag.`,
        ].join("\n\n")
      : [
          `Saken om ${topicLower} handler ikke bare om et enkelt ja-eller-nei-spørsmål, men om hvilke mål samfunnet ønsker å prioritere og hvilke konsekvenser ulike valg kan få over tid. ${capitalizeFirst(topicLower)} kan berøre både økonomi, trygghet, rettferdighet og tillit, avhengig av hvordan tiltaket utformes.`,
          `For velgeren er det derfor viktig å forstå hva dagens situasjon er, hvilke problemer tilhengerne mener må løses, og hvilke avveininger som følger med. Et godt bakteppe bør gjøre det lettere å se hvorfor saken engasjerer og hvorfor flere hensyn kan trekke i ulike retninger.`,
          `Historisk sett har lignende spørsmål blitt diskutert i Norge og andre land, ofte med ulike utfall avhengig av politisk kontekst, økonomiske rammer og samfunnets prioriteringer på det aktuelle tidspunktet. Erfaringer fra andre land kan gi nyttig innsikt, men må alltid vurderes opp mot norske forhold og verdier.`,
          `Når temaet vurderes, er det også naturlig å spørre hvem som blir mest berørt, hvor raskt eventuelle effekter kan komme, og om et nytt tiltak vil fungere bedre enn å justere det som allerede finnes i dag.`,
        ].join("\n\n"),
    argumentFor: normalizedContext
      ? [
          `Tilhengere vil kunne mene at ${topicLower} er et nødvendig grep fordi dagens utvikling ikke løser utfordringen godt nok. De kan hevde at et tydeligere politisk valg gjør det enklere å prioritere ressurser, sette retning og vise hva samfunnet faktisk ønsker å oppnå.${contextSentence}`,
          `Et argument for kan også være at tiltaket skaper mer forutsigbarhet for dem som blir berørt. Hvis målene er klare og innsatsen samles bedre, kan det gi raskere fremdrift, tydeligere ansvar og større sjanse for at problemet tas på alvor.`,
          `Noen vil i tillegg mene at det er bedre å handle mens utfordringen fortsatt kan påvirkes, enn å vente til kostnadene, konfliktene eller skadevirkningene blir større og vanskeligere å håndtere.`,
        ].join("\n\n")
      : [
          `Tilhengere vil kunne mene at ${topicLower} er et nødvendig grep fordi dagens utvikling ikke løser utfordringen godt nok. De kan hevde at et tydeligere politisk valg gjør det enklere å prioritere ressurser, sette retning og vise hva samfunnet faktisk ønsker å oppnå.`,
          `Et argument for kan også være at tiltaket skaper mer forutsigbarhet for dem som blir berørt. Hvis målene er klare og innsatsen samles bedre, kan det gi raskere fremdrift, tydeligere ansvar og større sjanse for at problemet tas på alvor.`,
          `Noen vil i tillegg mene at det er bedre å handle mens utfordringen fortsatt kan påvirkes, enn å vente til kostnadene, konfliktene eller skadevirkningene blir større og vanskeligere å håndtere.`,
        ].join("\n\n"),
    argumentAgainst: [
      `Motstandere vil kunne mene at effekten av ${topicLower} er mer usikker enn tilhengerne antyder. De kan være bekymret for at politiske løfter ser gode ut i prinsippet, men blir dyrere, mindre treffsikre eller mer krevende å gjennomføre i praksis.`,
      `Et annet motargument er at nye tiltak ofte kan få utilsiktede virkninger. Når staten, kommunen eller andre aktører endrer kurs, kan det påvirke fordeling, prioriteringer og handlingsrom på måter som ikke er enkle å forutse på forhånd.`,
      `Noen vil derfor mene at det er klokere å forbedre eksisterende ordninger, samle mer kunnskap eller prøve mindre inngrep først, før man binder seg til et større skifte knyttet til ${topicLower}.`,
    ].join("\n\n"),
    supportLabel: "For",
    opposeLabel: "Mot",
  };
}

export async function generateAdminIssueDraft(input: GenerateAdminIssueDraftInput): Promise<GeneratedAdminIssueDraft> {
  const fallbackDraft = generateLocalAdminIssueDraft(input);
  const openAiApiKey = getOpenAiApiKey();

  if (!openAiApiKey) {
    return { draft: fallbackDraft, source: "fallback" };
  }

  try {
    const generatedDraft = await requestOpenAiDraft(input, openAiApiKey);
    return {
      draft: mergeGeneratedDraft(generatedDraft, fallbackDraft),
      source: "openai",
    };
  } catch (error) {
    console.error("OpenAI-utkast feilet, bruker reservegenerator i stedet.", error);
    return { draft: fallbackDraft, source: "fallback" };
  }
}