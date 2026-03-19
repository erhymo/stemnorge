import type { CreateIssueInput } from "@/lib/issues";

export type AdminIssueDraft = Pick<
  CreateIssueInput,
  "slug" | "title" | "question" | "overview" | "background" | "argumentFor" | "argumentAgainst" | "supportLabel" | "opposeLabel"
>;

export type GenerateAdminIssueDraftInput = {
  topic: string;
  context?: string;
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

export function generateAdminIssueDraft({ topic, context }: GenerateAdminIssueDraftInput): AdminIssueDraft {
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
      ? `Denne saken handler om ${topicLower}.${contextSentence}`
      : `Denne saken handler om ${topicLower} og gir et førsteutkast til hva velgerne skal ta stilling til.`,
    background: normalizedContext
      ? `Bakgrunnen bør forklare dagens situasjon, hvilke mål som ønskes oppnådd og hvilke konsekvenser ${topicLower} kan få.${contextSentence}`
      : `Bakgrunnen bør forklare dagens situasjon, hvilke mål som ønskes oppnådd og hvilke konsekvenser ${topicLower} kan få.`,
    argumentFor: normalizedContext
      ? `Tilhengere vil kunne mene at ${topicLower} gir tydeligere prioritering og kan svare på utfordringer som allerede er synlige.${contextSentence}`
      : `Tilhengere vil kunne mene at ${topicLower} gir tydeligere prioritering, raskere fremdrift og ønsket samfunnseffekt.`,
    argumentAgainst: `Motstandere vil kunne mene at effekten er usikker, at kostnadene kan bli høyere enn ventet og at andre tiltak bør vurderes før man går videre med ${topicLower}.`,
    supportLabel: "For",
    opposeLabel: "Mot",
  };
}