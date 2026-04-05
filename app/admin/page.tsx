import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminIssueForm from "@/components/AdminIssueForm";
import AdminTipsGenerator from "@/components/AdminTipsGenerator";
import AdminPlannedIssues from "@/components/AdminPlannedIssues";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getCurrentIssueView, getHistoricalIssueViews, getPlannedIssueRecords, getNextAvailableIssueDates } from "@/lib/issues";
import { prisma } from "@/lib/prisma";
import { getAgendaTipsForAdmin } from "@/lib/tips";

export const dynamic = "force-dynamic";

function formatDateTimeLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/admin/login");
  }

  const [currentIssue, plannedIssues, historicalIssues, agendaTipsResult, totalUsers, verifiedUsers, nextAvailableDates] = await Promise.all([
    getCurrentIssueView(),
    getPlannedIssueRecords(),
    getHistoricalIssueViews(),
    getAgendaTipsForAdmin(),
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    getNextAvailableIssueDates(),
  ]);
  const { tips: agendaTips, unavailable: agendaTipsUnavailable } = agendaTipsResult;

  const plannedIssueItems = plannedIssues.map((issue) => ({
    id: issue.id,
    slug: issue.slug,
    title: issue.title,
    question: issue.question,
    overview: issue.overview,
    background: issue.background,
    argumentFor: issue.argumentFor,
    argumentAgainst: issue.argumentAgainst,
    supportLabel: issue.supportLabel,
    opposeLabel: issue.opposeLabel,
    publishedAt: issue.publishedAt.toISOString(),
    closesAt: issue.closesAt.toISOString(),
  }));

  const recentIssues = historicalIssues.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">Beskyttet adminflate</span>
            <span>Innlogget som {session.username}. Tilgangen verifiseres nå på serveren.</span>
          </div>
          <AdminLogoutButton />
        </div>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Planlegg publisering og lukking av saker manuelt</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Denne versjonen lar deg generere et førsteutkast med AI, deretter opprette, redigere og slette planlagte saker med publiseringstid og stengetid.
          Overlappende tidsvinduer avvises, slik at bare én sak kan være aktiv om gangen.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Registrerte brukere</p>
          <p className="mt-2 text-4xl font-semibold text-white">{totalUsers}</p>
          <p className="mt-1 text-sm text-slate-400">totalt registrert</p>
        </article>
        <article className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Verifiserte brukere</p>
          <p className="mt-2 text-4xl font-semibold text-emerald-200">{verifiedUsers}</p>
          <p className="mt-1 text-sm text-slate-400">har bekreftet e-post</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <AdminTipsGenerator />
          <AdminIssueForm
            key={nextAvailableDates.publishedAt.toISOString()}
            initialValues={{
              publishedAt: toDatetimeLocalValue(nextAvailableDates.publishedAt),
              closesAt: toDatetimeLocalValue(nextAvailableDates.closesAt),
            }}
          />
        </div>

        <div className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Aktiv sak</p>
                <h2 className="mt-2 text-2xl text-white">{currentIssue?.question ?? "Ingen aktiv sak akkurat nå"}</h2>
              </div>
              <Link href="/" className="text-sm font-medium text-cyan-200 transition hover:text-white">
                Se offentlig visning
              </Link>
            </div>

            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <p>{currentIssue?.overview ?? "Når neste sak publiseres, vil den vises her med åpning og stengetid."}</p>
              {currentIssue ? (
                <>
                  <p className="text-slate-400">Publisert: {formatDateTimeLabel(currentIssue.publishedAt)}</p>
                  <p className="text-slate-400">Lukkes: {formatDateTimeLabel(currentIssue.closesAt)}</p>
                </>
              ) : null}
            </div>
          </article>

          <AdminPlannedIssues issues={plannedIssueItems} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tips fra forsiden</p>
            <h2 className="mt-2 text-3xl text-white">Innkommende agenda-tips</h2>
          </div>
          <p className="text-sm text-slate-400">{agendaTips.length} mottatt</p>
        </div>

        {agendaTipsUnavailable ? (
          <p className="mb-4 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-100">
            Agenda-tips er midlertidig utilgjengelige i admin fordi databasen i production mangler siste tips-tabell. Resten av adminflaten fungerer fortsatt.
          </p>
        ) : null}

        {agendaTips.length ? (
          <div className="space-y-4">
            {agendaTips.map((tip) => (
              <article key={tip.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">Nytt tips</span>
                  <span>Mottatt {formatDateTimeLabel(tip.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-base leading-8 text-slate-200">{tip.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm leading-7 text-slate-400">
            Ingen tips er mottatt ennå. Når noen sender inn et tips fra forsiden, dukker det opp her.
          </p>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Nylig avsluttede saker</p>
            <h2 className="mt-2 text-3xl text-white">Historikken følger nå faktisk stengetid</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {recentIssues.map((issue) => (
            <article key={issue.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Lukket {formatDateTimeLabel(issue.closesAt)}</p>
              <h3 className="mt-3 text-lg text-white">{issue.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{issue.resultSummary ?? issue.overview}</p>
              <p className="mt-4 text-sm text-slate-200">
                Resultat: {issue.supportPercent ?? 0}% / {issue.opposePercent ?? 0}%
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
