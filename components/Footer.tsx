import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="font-medium text-slate-200">StemNorge</p>
          <p>
            En anonym stemmeplattform for ukentlige samfunnsspørsmål. Løsningen er ikke en offentlig
            folkeavstemning, men et privat initiativ for å samle innsikt og engasjement på en ryddig måte.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/historie" className="transition hover:text-white">Historikk</Link>
          <Link href="/gdpr" className="transition hover:text-white">Personvern</Link>
          <Link href="/register" className="transition hover:text-white">Opprett konto</Link>
        </div>
      </div>
    </footer>
  );
}