import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 md:py-16">
      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Stem registrert</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Takk for at du deltok</h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300">
          Stemmen din er registrert. Resultatet publiseres når ukens avstemning avsluttes søndag klokken 18:00.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/historie" className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 transition hover:bg-white/5">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Historikk</p>
          <h2 className="text-2xl text-white">Se tidligere resultater</h2>
        </Link>

        <Link href="/" className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 transition hover:bg-white/5">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Tilbake</p>
          <h2 className="text-2xl text-white">Gå til ukens sak</h2>
        </Link>
      </section>
    </div>
  );
}
