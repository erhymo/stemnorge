import Link from "next/link";
import { getHistoricalIssueViews } from "@/lib/issues";

export const dynamic = "force-dynamic";

export default async function HistoriePage() {
  const historicalIssues = await getHistoricalIssueViews();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:py-16">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Historikk</p>
        <h1 className="text-4xl text-white md:text-5xl">Tidligere saker og publiserte resultater</h1>
        <p className="text-lg leading-8 text-slate-300">
          Resultater publiseres først når ukens avstemning er avsluttet. Historikken viser oppsummering,
          argumenter og prosentvis utfall.
        </p>
      </div>

      <div className="grid gap-5">
        {historicalIssues.map((issue) => (
          <article key={issue.slug} className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-sm text-slate-400">{issue.periodLabel}</p>
                <Link href={`/historie/${issue.slug}`} className="block text-2xl font-semibold text-white transition hover:text-cyan-200">
                  {issue.question}
                </Link>
                <p className="text-base leading-8 text-slate-300">{issue.resultSummary}</p>
              </div>

              <div className="min-w-56 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="mb-2 font-medium text-white">Publisert resultat</p>
                <div className="flex items-center justify-between">
                  <span>{issue.supportLabel}</span>
                  <span className="font-semibold text-white">{issue.supportPercent}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>{issue.opposeLabel}</span>
                  <span className="font-semibold text-white">{issue.opposePercent}%</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
