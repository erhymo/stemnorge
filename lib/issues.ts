import { type Issue } from "@prisma/client";

import { currentIssue, historicalIssues, type PublishedIssue } from "@/lib/content";
import { prisma } from "@/lib/prisma";

type IssueSource = PublishedIssue["sources"][number];

const SYSTEM_ISSUE_SLUGS = ["legacy-prototype-import"];

export type IssueView = PublishedIssue & {
  id: number;
  publishedAt: string;
  closesAt: string;
  isOpen: boolean;
};

type SeedIssue = PublishedIssue & {
  publishedAt: Date;
  closesAt: Date;
};

export type CreateIssueInput = {
  slug: string;
  title: string;
  question: string;
  periodLabel?: string;
  overview: string;
  background: string;
  argumentFor: string;
  argumentAgainst: string;
  resultSummary?: string;
  supportLabel: string;
  opposeLabel: string;
  publishedAt: Date;
  closesAt: Date;
  sources?: IssueSource[];
  publishedSupportPercent?: number;
  publishedOpposePercent?: number;
};

export type UpdateIssueInput = CreateIssueInput;

function getMondayBase(now = new Date()) {
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function withTime(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(hours, 0, 0, 0);
  return next;
}

function getSeedIssues(): SeedIssue[] {
  const monday = getMondayBase();
  const currentPublishedAt = withTime(monday, 6);
  const currentClosesAt = withTime(shiftDays(monday, 6), 18);

  return [
    {
      ...currentIssue,
      publishedAt: currentPublishedAt,
      closesAt: currentClosesAt,
    },
    ...historicalIssues.map((issue, index) => {
      const offset = (index + 1) * -7;
      const publishedAt = withTime(shiftDays(monday, offset), 6);
      const closesAt = withTime(shiftDays(monday, offset + 6), 18);

      return {
        ...issue,
        publishedAt,
        closesAt,
      };
    }),
  ];
}

function parseSources(raw: string): IssueSource[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IssueSource[]) : [];
  } catch {
    return [];
  }
}

function calculatePercentages(forVotes: number, againstVotes: number) {
  const total = forVotes + againstVotes;

  if (total === 0) {
    return { supportPercent: 0, opposePercent: 0 };
  }

  return {
    supportPercent: Math.round((forVotes / total) * 100),
    opposePercent: Math.round((againstVotes / total) * 100),
  };
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatIssuePeriodLabel(publishedAt: Date, closesAt: Date) {
  return `Publisert ${formatDateTime(publishedAt)} · Resultat ${formatDateTime(closesAt)}`;
}

export function isIssueOpen(issue: Pick<Issue, "publishedAt" | "closesAt">, now = new Date()) {
  return issue.publishedAt <= now && issue.closesAt > now;
}

async function ensureSeedIssues() {
  const seedIssues = getSeedIssues();

  await Promise.all(
    seedIssues.map((issue) =>
      prisma.issue.upsert({
        where: { slug: issue.slug },
        update: {},
        create: {
          slug: issue.slug,
          title: issue.title,
          question: issue.question,
          periodLabel: issue.periodLabel,
          overview: issue.overview,
          background: issue.background,
          argumentFor: issue.argumentFor,
          argumentAgainst: issue.argumentAgainst,
          resultSummary: issue.resultSummary,
          supportLabel: issue.supportLabel,
          opposeLabel: issue.opposeLabel,
          publishedSupportPercent: issue.supportPercent,
          publishedOpposePercent: issue.opposePercent,
          sourcesJson: JSON.stringify(issue.sources),
          publishedAt: issue.publishedAt,
          closesAt: issue.closesAt,
        },
      }),
    ),
  );
}

async function getVoteBreakdown(issueId: number) {
  const [forVotes, againstVotes] = await Promise.all([
    prisma.vote.count({ where: { issueId, value: "for" } }),
    prisma.vote.count({ where: { issueId, value: "mot" } }),
  ]);

  return { forVotes, againstVotes, totalVotes: forVotes + againstVotes };
}

async function toIssueView(issue: Issue, now = new Date()): Promise<IssueView> {
  const sources = parseSources(issue.sourcesJson);
  const breakdown = await getVoteBreakdown(issue.id);
  const computedPercentages = calculatePercentages(breakdown.forVotes, breakdown.againstVotes);
  const open = isIssueOpen(issue, now);

  return {
    id: issue.id,
    slug: issue.slug,
    title: issue.title,
    question: issue.question,
    periodLabel: issue.periodLabel,
    overview: issue.overview,
    background: issue.background,
    argumentFor: issue.argumentFor,
    argumentAgainst: issue.argumentAgainst,
    resultSummary: issue.resultSummary ?? undefined,
    supportLabel: issue.supportLabel,
    opposeLabel: issue.opposeLabel,
    supportPercent: !open ? issue.publishedSupportPercent ?? computedPercentages.supportPercent : undefined,
    opposePercent: !open ? issue.publishedOpposePercent ?? computedPercentages.opposePercent : undefined,
    sources,
    publishedAt: issue.publishedAt.toISOString(),
    closesAt: issue.closesAt.toISOString(),
    isOpen: open,
  };
}

export async function getCurrentIssueRecord(now = new Date()) {
  await ensureSeedIssues();

  return prisma.issue.findFirst({
    where: {
      slug: { notIn: SYSTEM_ISSUE_SLUGS },
      publishedAt: { lte: now },
      closesAt: { gt: now },
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getCurrentIssueView(now = new Date()) {
  const issue = await getCurrentIssueRecord(now);

  if (!issue) {
    return null;
  }

  return toIssueView(issue, now);
}

export async function getHistoricalIssueViews(now = new Date()) {
  await ensureSeedIssues();

  const issues = await prisma.issue.findMany({
    where: {
      slug: { notIn: SYSTEM_ISSUE_SLUGS },
      closesAt: { lte: now },
    },
    orderBy: { closesAt: "desc" },
  });

  return Promise.all(issues.map((issue) => toIssueView(issue, now)));
}

export async function getHistoricalIssueView(slug: string, now = new Date()) {
  if (SYSTEM_ISSUE_SLUGS.includes(slug)) {
    return null;
  }

  await ensureSeedIssues();

  const issue = await prisma.issue.findFirst({
    where: {
      slug,
      closesAt: { lte: now },
    },
  });

  if (!issue) {
    return null;
  }

  return toIssueView(issue, now);
}

export async function getPlannedIssueRecords(now = new Date()) {
  await ensureSeedIssues();

  return prisma.issue.findMany({
    where: {
      slug: { notIn: SYSTEM_ISSUE_SLUGS },
      publishedAt: { gt: now },
    },
    orderBy: { publishedAt: "asc" },
  });
}

function buildIssueBaseData(input: CreateIssueInput, slug: string) {
  return {
    slug,
    title: input.title.trim(),
    question: input.question.trim(),
    periodLabel: input.periodLabel?.trim() || formatIssuePeriodLabel(input.publishedAt, input.closesAt),
    overview: input.overview.trim(),
    background: input.background.trim(),
    argumentFor: input.argumentFor.trim(),
    argumentAgainst: input.argumentAgainst.trim(),
    supportLabel: input.supportLabel.trim(),
    opposeLabel: input.opposeLabel.trim(),
    publishedAt: input.publishedAt,
    closesAt: input.closesAt,
  };
}

async function validateIssueMutation(input: CreateIssueInput, excludeIssueId?: number) {
  const slug = input.slug.trim();

  if (SYSTEM_ISSUE_SLUGS.includes(slug)) {
    throw new Error("Denne slugen er reservert internt.");
  }

  const existingIssue = await prisma.issue.findUnique({ where: { slug } });

  if (existingIssue && existingIssue.id !== excludeIssueId) {
    throw new Error("Det finnes allerede en sak med denne slugen.");
  }

  if (input.closesAt <= input.publishedAt) {
    throw new Error("Stengetid må være senere enn publiseringstid.");
  }

  const overlappingIssue = await prisma.issue.findFirst({
    where: {
      slug: { notIn: SYSTEM_ISSUE_SLUGS },
      ...(excludeIssueId ? { id: { not: excludeIssueId } } : {}),
      publishedAt: { lt: input.closesAt },
      closesAt: { gt: input.publishedAt },
    },
    orderBy: { publishedAt: "asc" },
  });

  if (overlappingIssue) {
    throw new Error(`Tidsvinduet overlapper med saken "${overlappingIssue.question}".`);
  }

  return slug;
}

async function getEditablePlannedIssue(issueId: number, now = new Date()) {
  await ensureSeedIssues();

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });

  if (!issue || SYSTEM_ISSUE_SLUGS.includes(issue.slug)) {
    throw new Error("Fant ikke saken.");
  }

  if (issue.publishedAt <= now) {
    throw new Error("Bare planlagte saker kan redigeres eller slettes.");
  }

  return issue;
}

export async function createIssue(input: CreateIssueInput) {
  await ensureSeedIssues();

  const slug = await validateIssueMutation(input);

  return prisma.issue.create({
    data: {
      ...buildIssueBaseData(input, slug),
      resultSummary: input.resultSummary?.trim() || null,
      publishedSupportPercent: input.publishedSupportPercent,
      publishedOpposePercent: input.publishedOpposePercent,
      sourcesJson: JSON.stringify(input.sources ?? []),
    },
  });
}

export async function updatePlannedIssue(issueId: number, input: UpdateIssueInput, now = new Date()) {
  await getEditablePlannedIssue(issueId, now);
  const slug = await validateIssueMutation(input, issueId);

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      ...buildIssueBaseData(input, slug),
      ...(input.resultSummary !== undefined ? { resultSummary: input.resultSummary.trim() || null } : {}),
    },
  });
}

export async function deletePlannedIssue(issueId: number, now = new Date()) {
  await getEditablePlannedIssue(issueId, now);
  return prisma.issue.delete({ where: { id: issueId } });
}

export async function getIssueVoteSummary(slug?: string, now = new Date()) {
  await ensureSeedIssues();

  const issue = slug
    ? SYSTEM_ISSUE_SLUGS.includes(slug)
      ? null
      : await prisma.issue.findFirst({
          where: {
            slug,
            publishedAt: { lte: now },
          },
        })
    : await getCurrentIssueRecord(now);

  if (!issue) {
    return null;
  }

  const breakdown = await getVoteBreakdown(issue.id);
  const open = isIssueOpen(issue, now);
  const calculatedPercentages = calculatePercentages(breakdown.forVotes, breakdown.againstVotes);
  const percentages = open
    ? calculatedPercentages
    : {
        supportPercent: issue.publishedSupportPercent ?? calculatedPercentages.supportPercent,
        opposePercent: issue.publishedOpposePercent ?? calculatedPercentages.opposePercent,
      };

  return {
    slug: issue.slug,
    isOpen: open,
    supportLabel: issue.supportLabel,
    opposeLabel: issue.opposeLabel,
    forVotes: breakdown.forVotes,
    againstVotes: breakdown.againstVotes,
    totalVotes: breakdown.totalVotes,
    supportPercent: percentages.supportPercent,
    opposePercent: percentages.opposePercent,
  };
}