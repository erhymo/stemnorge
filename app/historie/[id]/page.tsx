import { notFound } from "next/navigation";

import RichTextBlock from "@/components/RichTextBlock";
import { getHistoricalIssueView } from "@/lib/issues";

export const dynamic = "force-dynamic";

type HistorieDetaljPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistorieDetaljPage({ params }: HistorieDetaljPageProps) {
  const { id } = await params;
  const issue = await getHistoricalIssueView(id);

  if (!issue) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{issue.periodLabel}</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">{issue.question}</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">{issue.overview}</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:rounded-[2rem] md:p-8">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Bakgrunn</p>
        <RichTextBlock text={issue.background} className="space-y-4 text-base leading-8 text-slate-300" />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-300/15 bg-emerald-400/5 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-200/80">{issue.supportLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Argumenter som talte for</h2>
          <RichTextBlock text={issue.argumentFor} className="space-y-4 text-base leading-8 text-slate-200" />
        </article>

        <article className="rounded-2xl border border-rose-300/15 bg-rose-400/5 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-rose-200/80">{issue.opposeLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Argumenter som talte imot</h2>
          <RichTextBlock text={issue.argumentAgainst} className="space-y-4 text-base leading-8 text-slate-200" />
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Publisert resultat</p>
          <div className="space-y-3 text-base text-slate-300">
            <div className="flex items-center justify-between">
              <span>{issue.supportLabel}</span>
              <span className="font-semibold text-white">{issue.supportPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{issue.opposeLabel}</span>
              <span className="font-semibold text-white">{issue.opposePercent}%</span>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Kort oppsummering</p>
          <p className="text-base leading-8 text-slate-200">{issue.resultSummary}</p>
        </article>
      </section>

      {/* Kildegrunnlag – skjult inntil videre
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Kilder</p>
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <a
              key={source.title}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/30 hover:bg-white/7"
            >
              <p className="text-sm text-slate-400">{source.publisher}</p>
              <p className="mt-2 text-base font-medium text-white">{source.title}</p>
            </a>
          ))}
        </div>
      </section>
      */}
    </div>
  );
}
