import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-5xl items-center px-6 py-16">
      <section className="w-full overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-900/85 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur md:rounded-[2rem]">
        <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/12 via-white/5 to-emerald-400/10 p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">StemNorge</p>
          <h1 className="mt-5 text-4xl leading-tight text-white md:text-6xl">Siden er midlertidig lagt ned</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Takk til alle som har vært innom, lest sakene og deltatt i avstemningene. StemNorge er satt på pause inntil videre.
          </p>
        </div>

        <div className="space-y-8 p-6 md:p-10">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 text-left md:p-6">
            <h2 className="text-2xl text-white">Kontakt admin</h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Det er fortsatt mulig å sende en melding til admin hvis du har spørsmål, innspill eller ønsker å ta kontakt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tips"
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Send melding til admin
              </Link>
              <Link
                href="/historie"
                className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Se historikk
              </Link>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Tidligere saker og resultater ligger fortsatt tilgjengelig i historikken.
          </p>
        </div>
      </section>
    </div>
  );
}
