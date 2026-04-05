import { getOpenAiApiKey, getOpenAiModel } from "@/lib/env";

export type AdminTip = {
  topic: string;
  context: string;
};

export async function generateAdminTips(): Promise<AdminTip[]> {
  const openAiApiKey = getOpenAiApiKey();

  if (!openAiApiKey) {
    return [
      { topic: "Atomkraft i Norge", context: "Bør vi satse på atomkraft for å sikre strømforsyningen?" },
      { topic: "Formuesskatt", context: "Bør formuesskatten fjernes eller senkes?" },
      { topic: "Vindkraft på land", context: "Bør det bygges ut mer vindkraft på land?" },
      { topic: "Alkoholmonopolet", context: "Bør Vinmonopolets enerett beholdes?" },
      { topic: "Skolemat", context: "Bør det innføres et gratis måltid i grunnskolen?" }
    ];
  }

  let recentNews = "";
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
        recentNews = `\n\nHer er noen av dagens toppsaker fra NRK for inspirasjon til hva som er aktuelt AKKURAT NÅ (April 2026): ${titles}`;
      }
    }
  } catch (e) {
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
            "Du er en assistent for StemNorge som foreslår 5 høyst aktuelle og polariserende politiske eller samfunnsmessige saker i Norge akkurat nå.",
            "De må være saker som skaper massivt engasjement, sterk uenighet, og som diskuteres mye i norske medier for tiden.",
            "Fokuser gjerne på 'bomber' eller tunge debatter hvor befolkningen er delt på midten.",
            "Returner kun et JSON-objekt med en nøkkel 'tips' som er en array av objekter.",
            "Hvert objekt skal ha feltene 'topic' (kort tittel) og 'context' (2-3 setninger med oppsummering av hvorfor saken er så polariserende nå)."
          ].join(" ") + recentNews,
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
  return parsed.tips || [];
}
