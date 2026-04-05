"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminTip = {
  topic: string;
  context: string;
};

function toDatetimeLocalValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getDefaultDates() {
  const now = new Date();
  const nextMonday = new Date(now);
  const daysUntilMonday = ((8 - nextMonday.getDay()) % 7) || 7;

  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(6, 0, 0, 0);

  const closesAt = new Date(nextMonday);
  closesAt.setDate(closesAt.getDate() + 6);
  closesAt.setHours(18, 0, 0, 0);

  return {
    publishedAt: toDatetimeLocalValue(nextMonday),
    closesAt: toDatetimeLocalValue(closesAt),
  };
}

export default function AdminTipsGenerator() {
  const [tips, setTips] = useState<AdminTip[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleLoadTips() {
    setIsLoadingTips(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/issues/generate-tips", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Feil");
      setTips(data.tips || []);
      setExpandedTopic(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Kunne ikke hente tips.");
    } finally {
      setIsLoadingTips(false);
    }
  }

  async function handleGenerateIssue(tip: AdminTip) {
    setGeneratingFor(tip.topic);
    setMessage("");

    try {
      const resDraft = await fetch("/api/admin/issues/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: tip.topic, context: tip.context }),
      });
      const dataDraft = await resDraft.json();
      if (!resDraft.ok || !dataDraft.draft) {
        throw new Error(dataDraft.error || "Kunne ikke generere utkast.");
      }

      const { publishedAt, closesAt } = getDefaultDates();
      const issuePayload = {
        ...dataDraft.draft,
        publishedAt,
        closesAt,
      };

      const resCreate = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issuePayload),
      });
      const dataCreate = await resCreate.json();

      if (!resCreate.ok) {
        throw new Error(dataCreate.error || "Kunne ikke opprette saken.");
      }

      setMessage(`Sak "${dataCreate.issue.slug}" ble opprettet og lagt til i planlagte saker!`);
      setTips((prev) => prev.filter((t) => t.topic !== tip.topic));
      setExpandedTopic(null);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Feil under generering.");
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <article className="rounded-[2rem] border border-cyan-400/20 bg-cyan-950/20 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Aktuelle saker i Norge</p>
          <h2 className="mt-2 text-2xl text-white">AI-tips fra nyhetsbildet</h2>
        </div>
        <button
          type="button"
          onClick={handleLoadTips}
          disabled={isLoadingTips || generatingFor !== null}
          className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {isLoadingTips ? "Henter tips..." : "Hent nye tips"}
        </button>
      </div>

      {message && <p className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">{message}</p>}

      {tips.length > 0 && (
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/50">
              <button
                type="button"
                onClick={() => setExpandedTopic(expandedTopic === tip.topic ? null : tip.topic)}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/5"
              >
                <span className="font-medium text-slate-200">{tip.topic}</span>
                <span className="text-xl text-slate-500">{expandedTopic === tip.topic ? "−" : "+"}</span>
              </button>
              {expandedTopic === tip.topic && (
                <div className="border-t border-white/5 bg-black/20 p-4 text-sm text-slate-300">
                  <p className="mb-4 leading-relaxed">{tip.context}</p>
                  <button
                    type="button"
                    onClick={() => handleGenerateIssue(tip)}
                    disabled={generatingFor !== null}
                    className="rounded-full bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {generatingFor === tip.topic ? "Genererer og lagrer..." : "Generer og legg til sak"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
