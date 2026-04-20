import type { CreateIssueInput } from "@/lib/issues";
import { toAdminIssueSlug } from "@/lib/admin-issue-draft";
import { parseOsloDatetimeLocal } from "@/lib/oslo-time";

function readRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function readDate(value: unknown) {
  return parseOsloDatetimeLocal(value);
}

export function parseAdminIssueInput(body: unknown): CreateIssueInput | null {
  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const title = readRequiredString(payload.title);
  const question = readRequiredString(payload.question);
  const overview = readRequiredString(payload.overview);
  const background = readRequiredString(payload.background);
  const argumentFor = readRequiredString(payload.argumentFor);
  const argumentAgainst = readRequiredString(payload.argumentAgainst);
  const supportLabel = readRequiredString(payload.supportLabel) || "For";
  const opposeLabel = readRequiredString(payload.opposeLabel) || "Mot";
  const slug = toAdminIssueSlug(readRequiredString(payload.slug) || title);
  const publishedAt = readDate(payload.publishedAt);
  const closesAt = readDate(payload.closesAt);

  if (!title || !question || !overview || !background || !argumentFor || !argumentAgainst || !slug || !publishedAt || !closesAt) {
    return null;
  }

  return {
    slug,
    title,
    question,
    periodLabel: readOptionalString(payload.periodLabel),
    overview,
    background,
    argumentFor,
    argumentAgainst,
    resultSummary: readOptionalString(payload.resultSummary),
    supportLabel,
    opposeLabel,
    publishedAt,
    closesAt,
  };
}

export function getAdminIssueMutationErrorStatus(message: string) {
  if (message.includes("Fant ikke saken")) {
    return 404;
  }

  if (message.includes("overlapper") || message.includes("Bare planlagte saker")) {
    return 409;
  }

  return 400;
}