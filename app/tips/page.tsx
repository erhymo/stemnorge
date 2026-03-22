import type { Metadata } from "next";

import AgendaTipForm from "@/components/AgendaTipForm";

export const metadata: Metadata = {
  title: "Tips oss om saker | StemNorge",
  description: "Send inn forslag til saker du mener bør stå på agendaen neste uke.",
};

export default function TipsPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Tips oss</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Hvilke saker bør være på agendaen neste uke?</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Har du et tema, et lokalt problem eller et spørsmål du mener StemNorge bør løfte? Send oss noen ord, så havner tipset direkte i admin for vurdering.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• skriv kort og konkret hva saken gjelder</li>
          <li>• tipsene publiseres ikke automatisk</li>
          <li>• innspillene vurderes manuelt før noe eventuelt blir en sak</li>
        </ul>
      </section>

      <AgendaTipForm />
    </div>
  );
}