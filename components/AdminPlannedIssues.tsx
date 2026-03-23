"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AdminIssueForm, { toDatetimeLocalValue } from "@/components/AdminIssueForm";

type PlannedIssueItem = {
  id: number;
  slug: string;
  title: string;
  question: string;
  overview: string;
  background: string;
  argumentFor: string;
  argumentAgainst: string;
  supportLabel: string;
  opposeLabel: string;
  publishedAt: string;
  closesAt: string;
};

type AdminPlannedIssuesProps = {
  issues: PlannedIssueItem[];
};

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function AdminPlannedIssues({ issues }: AdminPlannedIssuesProps) {
  const router = useRouter();
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [publishingIssueId, setPublishingIssueId] = useState<number | null>(null);
  const [swappingIds, setSwappingIds] = useState<Set<number>>(new Set());

  async function handleSwap(issueA: PlannedIssueItem, issueB: PlannedIssueItem) {
    setFeedback("");
    setSwappingIds(new Set([issueA.id, issueB.id]));

    try {
      const res = await fetch("/api/admin/issues/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueIdA: issueA.id, issueIdB: issueB.id }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback(typeof data.error === "string" ? data.error : "Kunne ikke bytte rekkefølge.");
        return;
      }

      router.refresh();
    } catch {
      setFeedback("Noe gikk galt under endring av rekkefølge.");
    } finally {
      setSwappingIds(new Set());
    }
  }

  async function handlePublishNow(issue: PlannedIssueItem) {
    const confirmed = window.confirm(`Publiser "${issue.question}" nå? Saken blir umiddelbart tilgjengelig for stemming.`);

    if (!confirmed) {
      return;
    }

    setFeedback("");
    setPublishingIssueId(issue.id);

    try {
      const res = await fetch(`/api/admin/issues/${issue.id}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback(typeof data.error === "string" ? data.error : "Kunne ikke publisere saken.");
        return;
      }

      setFeedback(`Saken "${issue.slug}" ble publisert!`);
      router.refresh();
    } catch {
      setFeedback("Noe gikk galt under publisering av saken.");
    } finally {
      setPublishingIssueId(null);
    }
  }

  async function handleDelete(issue: PlannedIssueItem) {
    const confirmed = window.confirm(`Slett den planlagte saken "${issue.question}"? Dette kan ikke angres.`);

    if (!confirmed) {
      return;
    }

    setFeedback("");
    setDeletingIssueId(issue.id);

    try {
      const res = await fetch(`/api/admin/issues/${issue.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback(typeof data.error === "string" ? data.error : "Kunne ikke slette saken.");
        return;
      }

      setEditingIssueId((current) => (current === issue.id ? null : current));
      setFeedback(`Saken "${issue.slug}" ble slettet.`);
      router.refresh();
    } catch {
      setFeedback("Noe gikk galt under sletting av saken.");
    } finally {
      setDeletingIssueId(null);
    }
  }

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Planlagte saker</p>
        <p className="text-xs text-slate-500">Kun fremtidige saker kan redigeres eller slettes.</p>
      </div>

      {feedback ? <p className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{feedback}</p> : null}

      <div className="space-y-4">
        {issues.length === 0 ? (
          <p className="text-sm leading-7 text-slate-300">Ingen fremtidige saker er planlagt ennå.</p>
        ) : (
          issues.map((issue, index) => {
            const isEditing = editingIssueId === issue.id;
            const isDeleting = deletingIssueId === issue.id;
            const isSwapping = swappingIds.has(issue.id);
            const isFirst = index === 0;
            const isLast = index === issues.length - 1;

            return (
              <article key={issue.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
                <div className="flex items-start gap-4">
                  {issues.length > 1 ? (
                    <div className="flex flex-col gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSwap(issue, issues[index - 1])}
                        disabled={isFirst || isSwapping}
                        title="Flytt opp"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-sm text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwap(issue, issues[index + 1])}
                        disabled={isLast || isSwapping}
                        title="Flytt ned"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-sm text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{issue.question}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{issue.slug}</p>
                      <p className="mt-3 text-sm text-slate-300">Publiseres {formatDateTimeLabel(issue.publishedAt)}</p>
                      <p className="text-sm text-slate-400">Lukkes {formatDateTimeLabel(issue.closesAt)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handlePublishNow(issue)} disabled={publishingIssueId === issue.id} className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-200/50 hover:bg-emerald-400/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-70">
                        {publishingIssueId === issue.id ? "Publiserer..." : "Publiser nå"}
                      </button>
                      <button type="button" onClick={() => {
                        setFeedback("");
                        setEditingIssueId((current) => (current === issue.id ? null : issue.id));
                      }} className="rounded-full border border-cyan-300/25 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-200/50 hover:text-white">
                        {isEditing ? "Lukk redigering" : "Rediger"}
                      </button>
                      <button type="button" onClick={() => handleDelete(issue)} disabled={isDeleting} className="rounded-full border border-rose-300/20 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-200/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-70">
                        {isDeleting ? "Sletter..." : "Slett"}
                      </button>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <AdminIssueForm
                      key={issue.id}
                      mode="edit"
                      issueId={issue.id}
                      initialValues={{
                        title: issue.title,
                        slug: issue.slug,
                        question: issue.question,
                        overview: issue.overview,
                        background: issue.background,
                        argumentFor: issue.argumentFor,
                        argumentAgainst: issue.argumentAgainst,
                        supportLabel: issue.supportLabel,
                        opposeLabel: issue.opposeLabel,
                        publishedAt: toDatetimeLocalValue(new Date(issue.publishedAt)),
                        closesAt: toDatetimeLocalValue(new Date(issue.closesAt)),
                      }}
                      onCancel={() => setEditingIssueId(null)}
                      onSuccess={(message) => {
                        setEditingIssueId(null);
                        setFeedback(message);
                      }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}