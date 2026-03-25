import Link from "next/link";

import RichTextBlock from "@/components/RichTextBlock";
import { getCurrentIssueView, getHistoricalIssueViews } from "@/lib/issues";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [currentIssue, historicalIssues] = await Promise.all([
    getCurrentIssueView(),
    getHistoricalIssueViews(),
  ]);
  const lastIssue = historicalIssues[0];

  if (!currentIssue) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur md:rounded-[2rem] md:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Ukens sak</p>
          <h1 className="mt-4 text-4xl text-white md:text-5xl">Ingen aktiv avstemning akkurat nå</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">Neste publisering skjer mandag klokken 06:00. Historikken er fortsatt åpen for alle.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/historie" className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Se historikk</Link>
            <Link href="/tips" className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5">Tips oss om saker</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12 md:py-20">
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur md:rounded-[2rem] md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              Avstemning pågår
            </span>
            <span>{currentIssue.periodLabel}</span>
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">{currentIssue.title}</p>
            <h1 className="max-w-4xl text-4xl leading-tight text-white md:text-6xl">{currentIssue.question}</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">{currentIssue.overview}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/vote" className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
              Les ferdig og stem
            </Link>
            <Link href="/register" className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Opprett konto
            </Link>
            <Link href="/tips" className="rounded-full border border-cyan-300/30 bg-cyan-400/5 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:text-white">
              Tips oss om saker
            </Link>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/40 md:rounded-[2rem] md:p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Slik fungerer uka</p>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-medium text-white">Mandag 06:00</p>
              <p>Ny sak publiseres med bakgrunn og argumenter.</p>
            </div>
            <div>
              <p className="font-medium text-white">Gjennom uka</p>
              <p>Innloggede brukere kan stemme anonymt og oppdatere stemmen sin før fristen.</p>
            </div>
            <div>
              <p className="font-medium text-white">Søndag 18:00</p>
              <p>Avstemningen lukkes og resultatet publiseres offentlig med oppsummering.</p>
            </div>
          </div>
          {lastIssue && lastIssue.supportPercent != null && lastIssue.opposePercent != null && (
            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 font-medium text-white">Siste avstemning</p>
              <p className="text-sm text-slate-300">{lastIssue.question}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-emerald-200">{lastIssue.supportLabel} {lastIssue.supportPercent}%</span>
                <span className="text-rose-200">{lastIssue.opposeLabel} {lastIssue.opposePercent}%</span>
              </div>
              <Link href={`/historie/${lastIssue.slug}`} className="mt-2 inline-block text-xs text-cyan-200/70 transition hover:text-white">
                Se detaljer →
              </Link>
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Bakgrunn</p>
          <RichTextBlock text={currentIssue.background} className="space-y-4 text-base leading-8 text-slate-300 md:text-lg" />
        </article>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-cyan-400/10 to-transparent p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-400">Før du stemmer</p>
          <ul className="space-y-3 text-sm leading-7 text-slate-300">
            <li>• Alle kan lese saken uten innlogging.</li>
            <li>• Du må ha verifisert konto for å stemme.</li>
            <li>• Stemmevalg vises ikke offentlig per person.</li>
            <li>• Resultatet publiseres først når saken er avsluttet.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-emerald-300/15 bg-emerald-400/5 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-emerald-200/80">{currentIssue.supportLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Argumenter som taler for</h2>
          <RichTextBlock text={currentIssue.argumentFor} className="space-y-4 text-base leading-8 text-slate-200" />
        </article>

        <article className="rounded-2xl border border-rose-300/15 bg-rose-400/5 p-5 md:rounded-[2rem] md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-rose-200/80">{currentIssue.opposeLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Argumenter som taler imot</h2>
          <RichTextBlock text={currentIssue.argumentAgainst} className="space-y-4 text-base leading-8 text-slate-200" />
        </article>
      </section>

      {/* Kildegrunnlag – skjult inntil videre
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Kilder</p>
            <h2 className="mt-2 text-3xl text-white">Åpent kildegrunnlag</h2>
          </div>
          <Link href="/historie" className="text-sm font-medium text-cyan-200 transition hover:text-white">
            Se tidligere saker
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {currentIssue.sources.map((source) => (
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
