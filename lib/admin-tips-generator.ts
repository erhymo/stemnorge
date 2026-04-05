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
            "Du er en assistent som foreslår 5 aktuelle politiske eller samfunnsmessige saker i Norge akkurat nå.",
            "De må være saker som diskuteres mye i norske medier for tiden.",
            "Returner kun et JSON-objekt med en nøkkel 'tips' som er en array av objekter.",
            "Hvert objekt skal ha feltene 'topic' (kort tittel) og 'context' (2-3 setninger med oppsummering av saken)."
          ].join(" "),
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
