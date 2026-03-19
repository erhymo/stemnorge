export type PublishedIssue = {
  slug: string;
  title: string;
  question: string;
  periodLabel: string;
  overview: string;
  background: string;
  argumentFor: string;
  argumentAgainst: string;
  resultSummary?: string;
  supportLabel: string;
  opposeLabel: string;
  supportPercent?: number;
  opposePercent?: number;
  sources: Array<{ title: string; publisher: string; url: string }>;
};

export const currentIssue: PublishedIssue = {
  slug: "kjernekraft-i-norge",
  title: "Ukens sak",
  question: "Bør Norge åpne for å bygge kjernekraftverk?",
  periodLabel: "Publisert mandag 06:00 · Resultat søndag 18:00",
  overview:
    "StemNorge samler ett tema i uka. Målet er ikke å rope høyest, men å gjøre det enklere å lese seg opp, ta stilling og avgi en anonym stemme på et tydelig spørsmål.",
  background:
    "Kjernekraft trekkes fram som et mulig svar på økt kraftbehov, utslippskutt og behovet for mer stabil strøm. Samtidig reiser temaet spørsmål om kostnader, tidsbruk, sikkerhet, avfall og hva som faktisk er realistisk i norsk sammenheng. I V1 bruker vi en eksempel­sak for å forme leseopplevelsen, rytmen i uka og hvordan kilder presenteres før avstemningen lukkes.",
  argumentFor:
    "Tilhengere mener kjernekraft kan gi stabil kraftproduksjon med lave utslipp over tid, og at det kan redusere sårbarheten i et energisystem som ellers blir mer avhengig av vær og nettflaskehalser. De peker også på at teknologien utvikler seg, og at Norge bør holde døren åpen for nye energikilder når etterspørselen øker.",
  argumentAgainst:
    "Motstandere peker på høye investeringskostnader, lang byggetid og usikkerhet rundt hvor raskt kjernekraft faktisk kan bidra sammenlignet med andre tiltak. De trekker også fram spørsmål om avfall, beredskap og at politisk oppmerksomhet og kapital kan bli bundet opp i prosjekter som ligger langt fram i tid.",
  supportLabel: "For",
  opposeLabel: "Mot",
  sources: [
    { title: "Kjernekraft i Norge", publisher: "NVE", url: "https://www.nve.no" },
    { title: "Nuclear Power in a Clean Energy System", publisher: "IEA", url: "https://www.iea.org" },
    { title: "Energy Outlook", publisher: "IEA", url: "https://www.iea.org/reports/world-energy-outlook-2024" },
  ],
};

export const historicalIssues: PublishedIssue[] = [
  {
    slug: "ol-i-norge",
    title: "Tidligere sak",
    question: "Bør Norge søke om å arrangere vinter-OL igjen?",
    periodLabel: "Uke 33 · Resultat publisert søndag 18:00",
    overview:
      "Spørsmålet handlet om kostnader, nasjonal gevinst og hva et nytt OL faktisk ville kreve av stat, kommuner og arrangører.",
    background:
      "Et norsk OL kan gi internasjonal oppmerksomhet, aktivitet og investeringer, men krever også store offentlige og private forpliktelser. Debatten handler ofte om hva slags arrangement Norge ønsker å være vertskap for, og hvem som skal ta regningen dersom budsjettene sprekker.",
    argumentFor:
      "Tilhengere mente at et nytt OL kan samle landet, styrke frivilligheten og gi varige løft for idrett, reiseliv og infrastruktur dersom prosjektet planlegges stramt og realistisk.",
    argumentAgainst:
      "Motstandere pekte på risiko for budsjettoverskridelser, behov for store offentlige garantier og at pengene kunne gitt større samfunnsnytte på andre områder.",
    resultSummary:
      "Et flertall var skeptiske til å bruke store offentlige ressurser på et nytt OL nå.",
    supportLabel: "Ja",
    opposeLabel: "Nei",
    supportPercent: 38,
    opposePercent: 62,
    sources: [{ title: "Tidligere utredninger om OL", publisher: "KUD", url: "https://www.regjeringen.no" }],
  },
  {
    slug: "eu-medlemskap",
    title: "Tidligere sak",
    question: "Bør Norge utrede et nytt forsøk på EU-medlemskap?",
    periodLabel: "Uke 32 · Resultat publisert søndag 18:00",
    overview:
      "Saken tok for seg handel, suverenitet, beredskap og norsk påvirkning i Europa.",
    background:
      "EU-spørsmålet berører både økonomi, regelverk og hvordan Norge ønsker å plassere seg geopolitisk. Et nytt utredningsløp kan gi mer kunnskap, men kan også åpne en splittende debatt uten klart politisk grunnlag.",
    argumentFor:
      "Tilhengere mente en ny utredning er nødvendig for å vurdere Norges faktiske handlingsrom og om dagens tilknytning gir tilstrekkelig innflytelse i spørsmål som allerede påvirker norsk politikk.",
    argumentAgainst:
      "Motstandere mente dagens avtaler allerede gir nødvendig markedsadgang, og at en ny medlemskapsprosess vil skape stor uro uten å gi tydelig gevinst for velgerne her og nå.",
    resultSummary:
      "Stemmegivningen endte jevnt, men med en liten overvekt mot å starte et nytt EU-spor nå.",
    supportLabel: "Ja",
    opposeLabel: "Nei",
    supportPercent: 47,
    opposePercent: 53,
    sources: [{ title: "EØS og Norges forhold til EU", publisher: "Regjeringen", url: "https://www.regjeringen.no" }],
  },
];

export function getHistoricalIssue(slug: string) {
  return historicalIssues.find((issue) => issue.slug === slug);
}