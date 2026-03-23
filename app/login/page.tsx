"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { notifySessionChanged, saveSession } from "@/lib/session";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = useMemo(() => {
    const requestedNext = searchParams?.get("next") ?? null;
    return requestedNext && requestedNext.startsWith("/") ? requestedNext : "/vote";
  }, [searchParams]);

  const verifiedParam = searchParams?.get("verified") ?? null;
  const verifiedMessage = verifiedParam === "ok"
    ? "✅ E-postadressen din er bekreftet! Du kan nå logge inn."
    : verifiedParam === "invalid"
    ? "❌ Ugyldig eller utløpt verifiseringslenke."
    : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setShowResend(false);

    if (!email || !password) {
      setMessage("Vennligst fyll inn både e-post og passord.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Logger inn...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        saveSession(data.token, data.user);
        notifySessionChanged();
        setMessage("Innlogging vellykket!");
        router.push(nextHref);
        router.refresh();
      } else if (data.code === "EMAIL_NOT_VERIFIED") {
        setMessage(data.error);
        setShowResend(true);
      } else {
        setMessage(data.error || "Feil e-post eller passord.");
      }
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setMessage("Sender ny verifiseringsmail...");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "E-post sendt, sjekk innboksen din.");
      setShowResend(false);
    } catch {
      setMessage("Kunne ikke sende e-post. Prøv igjen.");
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Innlogging</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Logg inn for å avgi en anonym stemme</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Logg inn med e-post og passord. Når du er inne, kan du stemme én gang på ukens
          sak. Resultatet publiseres først når avstemningen er avsluttet.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• én konto per e-postadresse</li>
          <li>• passordet ditt lagres kryptert</li>
          <li>• stemmevalg publiseres ikke per person</li>
          <li>• du sendes videre til stemmesiden etter innlogging</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl text-white">Velkommen tilbake</h2>
          <p className="text-sm leading-7 text-slate-400">Bruk samme e-post og passord som da du opprettet konto.</p>
        </div>

        {verifiedMessage && (
          <p className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{verifiedMessage}</p>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">E-post</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Passord</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tegn"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p>{message}</p>
            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-2 text-cyan-200 underline transition hover:text-white"
              >
                Send verifiseringsmail på nytt
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 text-sm text-slate-400">
          <p>
            Har du ikke konto ennå?{" "}
            <Link href="/register" className="font-medium text-cyan-200 transition hover:text-white">
              Registrer deg her
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="font-medium text-cyan-200 transition hover:text-white">
              Glemt passord?
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center justify-center px-6 py-12 text-slate-300">
          Laster innlogging...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
