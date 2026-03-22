"use client";

import { useState } from "react";

const MAX_MESSAGE_LENGTH = 600;

export default function AgendaTipForm() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.error || "Kunne ikke sende inn tipset akkurat nå.");
        return;
      }

      setMessage("");
      setFeedback("Takk! Tipset ditt er sendt inn og ligger nå klart i admin.");
    } catch {
      setFeedback("Noe gikk galt da tipset skulle sendes inn.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl text-white">Send inn et tips</h2>
        <p className="text-sm leading-7 text-slate-400">Skriv kort hva du ønsker at vi skal løfte på agendaen neste uke.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Ditt tips</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            rows={6}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="For eksempel: Vi bør diskutere kollektivprisene, fastlegenes kapasitet eller trygghet i nærmiljøet."
            className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <p>Hold tipset kort og konkret. Ingen innlogging er nødvendig.</p>
          <p>{message.trim().length}/{MAX_MESSAGE_LENGTH} tegn</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sender tips..." : "Send inn tips"}
        </button>
      </form>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{feedback}</p>
      ) : null}
    </section>
  );
}