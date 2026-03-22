"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import RichTextBlock from "@/components/RichTextBlock";
import { type IssueView } from "@/lib/issues";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  notifySessionChanged,
  type SessionUser,
} from "@/lib/session";

type VoteClientProps = {
  issue: IssueView | null;
};

export default function VoteClient({ issue }: VoteClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (!storedUser || !storedToken) {
      router.replace("/login?next=/vote");
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    setLoading(false);
  }, [router]);

  async function handleVote(choice: "for" | "mot") {
    if (!token || !user || !issue) {
      return;
    }

    setIsSubmitting(true);
    setMessage("Registrerer stemmen din...");

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, value: choice }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/thanks");
        router.refresh();
        return;
      }

      if (res.status === 401) {
        clearSession();
        notifySessionChanged();
        router.replace("/login?next=/vote");
        return;
      }

      setMessage(data.error || "Stemmen kunne ikke registreres.");
    } catch {
      setMessage("Noe gikk galt under registrering av stemmen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-5xl items-center justify-center px-6 py-12 text-slate-300">Laster stemmesiden...</div>;
  }

  if (!user) {
    return null;
  }

  if (!issue) {
    return <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-4xl items-center justify-center px-6 py-12 text-center text-slate-300">Det er ingen åpen sak akkurat nå. Neste publisering skjer mandag klokken 06:00.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">Klar til å stemme</span>
          <span>Innlogget som {user.name}</span>
        </div>

        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Ukens sak</p>
          <h1 className="text-4xl leading-tight text-white md:text-5xl">{issue.question}</h1>
          <p className="text-lg leading-8 text-slate-300">Når du stemmer her, registreres valget ditt på den aktive saken. Hvis du stemmer på nytt før fristen, oppdateres stemmen din.</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <button type="button" onClick={() => handleVote("for")} disabled={isSubmitting} className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/5 p-8 text-left transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-70">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-200/80">{issue.supportLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Stem for forslaget</h2>
          <RichTextBlock text={issue.argumentFor} className="space-y-4 text-base leading-8 text-slate-200" />
        </button>

        <button type="button" onClick={() => handleVote("mot")} disabled={isSubmitting} className="rounded-[2rem] border border-rose-300/15 bg-rose-400/5 p-8 text-left transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-70">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-rose-200/80">{issue.opposeLabel}</p>
          <h2 className="mb-4 text-3xl text-white">Stem mot forslaget</h2>
          <RichTextBlock text={issue.argumentAgainst} className="space-y-4 text-base leading-8 text-slate-200" />
        </button>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 text-sm leading-7 text-slate-300">
        <p>• Hver konto har én stemme per sak.</p>
        <p>• Et nytt valg før fristen oppdaterer stemmen din.</p>
        <p>• Resultatet publiseres først når saken er avsluttet.</p>
      </section>

      {message && <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}