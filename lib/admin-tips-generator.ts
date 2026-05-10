import { getOpenAiApiKey, getOpenAiModel } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type AdminTip = {
  topic: string;
  context: string;
};

const EXCLUDED_REPEAT_TOPICS = [
  "formuesskatt",
  "formueskatt",
  "atomkraft",
  "kjernekraft",
  "eu-medlemskap",
  "eu medlemskap",
  "norsk eu-medlemskap",
];

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function shouldFilterRepeatedTip(tip: AdminTip) {
  const text = `${tip.topic} ${tip.context}`.toLowerCase();
  return EXCLUDED_REPEAT_TOPICS.some((topic) => text.includes(topic));
}

async function getPreviousIssuesPromptContext() {
  const issues = await prisma.issue.findMany({
    where: {
      slug: { notIn: ["legacy-prototype-import", "null-issue-system-only", "stemnorge-demo-sak"] },
    },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      title: true,
      question: true,
    },
  });

  if (!issues.length) {
    return "";
  }

  const issueList = issues.map((issue, index) => `${index + 1}. ${issue.title}: ${issue.question}`).join("\n");
  return `\n\nTidligere eller planlagte saker som IKKE skal foreslås igjen, heller ikke med litt annen vinkling:\n${issueList}`;
}

export async function generateAdminTips(): Promise<AdminTip[]> {
  const openAiApiKey = getOpenAiApiKey();

  if (!openAiApiKey) {
    return [
      { topic: "Vindkraft på land", context: "Bør det bygges ut mer vindkraft på land?" },
      { topic: "Alkoholmonopolet", context: "Bør Vinmonopolets enerett beholdes?" },
      { topic: "Skolemat", context: "Bør det innføres et gratis måltid i grunnskolen?" },
      { topic: "Aktiv dødshjelp", context: "Bør aktiv dødshjelp legaliseres i Norge?" },
      { topic: "Mobilforbud i skolen", context: "Bør norske skoler innføre nasjonalt mobilforbud i skoletiden?" },
      { topic: "Privat helseforsikring", context: "Bør arbeidsgivere kunne kjøpe raskere helsehjelp til ansatte?" }
    ];
  }

  let recentNews = "";
  const currentDate = getCurrentDateLabel();
  const previousIssues = await getPreviousIssuesPromptContext();
  try {
    const rssResponse = await fetch("https://www.nrk.no/toppsaker.rss", { cache: "no-store" });
    if (rssResponse.ok) {
      const xml = await rssResponse.text();
      const titles = Array.from(xml.matchAll(/<title>(.*?)<\/title>/g))
        .map((m) => m[1])
        .filter((t) => t !== "NRK" && t !== "NRK logo")
        .slice(0, 15)
        .join(" | ");
      if (titles) {
        recentNews = `\n\nHer er noen av dagens toppsaker fra NRK for inspirasjon til hva som er aktuelt AKKURAT NÅ (${currentDate}): ${titles}`;
      }
    }
  } catch {
    // Ignorer feil, fortsett uten nyhetsoppdatering
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Du er en assistent for StemNorge som foreslår eksakt 8 kandidater til aktuelle og polariserende politiske eller samfunnsmessige saker i Norge akkurat nå.",
            "De 4 første kandidatene skal være brede, tidløse og prinsipielle samfunnsdebatter hvor befolkningen kan være delt, men de må variere fra gang til gang.",
            "Ikke bruk disse gjentakende temaene nå: formuesskatt, atomkraft/kjernekraft eller norsk EU-medlemskap.",
            "Ikke foreslå saker som allerede finnes i listen over tidligere eller planlagte saker under, heller ikke med litt annen ordlyd.",
            "Finn heller nye vinkler innen for eksempel skole, helse, bolig, politi/justis, samferdsel, klima uten olje/atomkraft, innvandring, teknologi, personvern, arbeidsliv, landbruk, barn/unge eller eldreomsorg.",
            "De 4 siste kandidatene MÅ være basert direkte på nyhetsbildet akkurat nå (fra NRK-overskriftene under).",
            "Sørg for at alle sakene skaper massivt engasjement og sterk uenighet.",
            "Returner kun et JSON-objekt med en nøkkel 'tips' som er en array av nøyaktig 8 objekter.",
            "Hvert objekt skal ha feltene 'topic' (kort tittel) og 'context' (2-3 setninger med oppsummering av hvorfor saken er så polariserende nå)."
          ].join(" ") + previousIssues + recentNews,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI svarte med ${response.status}.`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returnerte ikke noe innhold.");
  }

  const parsed = JSON.parse(content) as { tips?: AdminTip[] };
  return (parsed.tips || []).filter((tip) => !shouldFilterRepeatedTip(tip)).slice(0, 6);
}
