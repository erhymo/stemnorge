export default function GDPRPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 md:py-16">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Personvern</p>
        <h1 className="text-4xl text-white md:text-5xl">Hvordan vi tenker om anonymitet og persondata</h1>
        <p className="text-lg leading-8 text-slate-300">
          StemNorge skal gjøre det enkelt å delta, men også lett å forstå hvilke opplysninger som brukes og hvorfor.
          Vi samler bare det som er nødvendig for å verifisere brukere og hindre flere stemmer fra samme konto.
        </p>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <h2 className="mb-4 text-2xl text-white">Det vi lagrer</h2>
        <ul className="space-y-3 text-base leading-8 text-slate-300">
          <li>• fullt navn ved registrering</li>
          <li>• e-postadresse for innlogging</li>
          <li>• kryptert passord for å beskytte kontoen din</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <h2 className="mb-4 text-2xl text-white">Det vi ikke viser offentlig</h2>
        <p className="text-base leading-8 text-slate-300">
          Stemmen din skal være anonym utad. Offentligheten får se når en sak er aktiv, og etter fristen publiseres
          resultat i prosent og kort oppsummering. Admin skal ikke kunne bla i enkeltbrukeres stemmevalg.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
        <h2 className="mb-4 text-2xl text-white">Hvorfor vi trenger opplysningene</h2>
        <p className="text-base leading-8 text-slate-300">
          Opplysningene brukes for å verifisere kontoer, beskytte innloggingen din, og sørge for at én konto bare kan
          stemme én gang per sak. Vi ønsker å lagre minst mulig data og formulere dette tydelig i personvernerklæringen
          når V1 går live.
        </p>
      </section>
    </div>
  );
}
