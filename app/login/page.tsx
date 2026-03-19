"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { notifySessionChanged, saveSession } from "@/lib/session";

function LoginPageContent() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = useMemo(() => {
    const requestedNext = searchParams?.get("next") ?? null;
    return requestedNext && requestedNext.startsWith("/") ? requestedNext : "/vote";
  }, [searchParams]);

  async function handleRequestCode() {
    setMessage("");

    if (!phone) {
      setMessage("Vennligst skriv inn mobilnummeret ditt først.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Sender SMS-kode...");

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Kunne ikke sende SMS-kode.");
        return;
      }

      setHasRequestedCode(true);
      setDevCode(typeof data.devCode === "string" ? data.devCode : "");
      setMessage(
        typeof data.devCode === "string"
          ? `SMS-kode sendt. Utviklingskode: ${data.devCode}`
          : "SMS-kode sendt. Skriv inn koden for å logge inn.",
      );
    } catch {
      setMessage("Noe gikk galt under utsending av SMS-kode.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!phone || !code) {
      setMessage("Vennligst fyll inn både telefonnummer og SMS-kode.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Verifiserer kode og logger inn...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        saveSession(data.token, data.user);
        notifySessionChanged();
        setMessage("Innlogging vellykket!");
        router.push(nextHref);
        router.refresh();
      } else {
        setMessage(data.error || "Feil telefonnummer eller SMS-kode.");
      }
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Innlogging</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Logg inn for å avgi en anonym stemme</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Du logger inn med mobilnummer og en engangskode på SMS. Når du er inne, kan du stemme én gang på ukens
          sak. Resultatet publiseres først når avstemningen er avsluttet.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• én konto per mobilnummer</li>
          <li>• engangskoden utløper automatisk etter kort tid</li>
          <li>• stemmevalg publiseres ikke per person</li>
          <li>• du sendes videre til stemmesiden etter innlogging</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl text-white">Velkommen tilbake</h2>
          <p className="text-sm leading-7 text-slate-400">Bruk samme mobilnummer som da du opprettet konto.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Telefonnummer</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCode("");
                setDevCode("");
                setHasRequestedCode(false);
              }}
              placeholder="f.eks. 900 00 000"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          {hasRequestedCode && (
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block">SMS-kode</span>
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Skriv inn 6-sifret kode"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
              />
            </label>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRequestCode}
            className="rounded-full border border-cyan-300/40 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && !hasRequestedCode ? "Sender kode..." : hasRequestedCode ? "Send ny kode" : "Send SMS-kode"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !hasRequestedCode}
            className="mt-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && hasRequestedCode ? "Logger inn..." : "Logg inn med kode"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
        )}

        {devCode && (
          <p className="mt-3 text-xs text-cyan-200/80">Utviklingsmodus: bruk koden {devCode} hvis ingen ekte SMS-leverandør er satt opp.</p>
        )}

        <p className="mt-6 text-sm text-slate-400">
          Har du ikke konto ennå?{" "}
          <Link href="/register" className="font-medium text-cyan-200 transition hover:text-white">
            Registrer deg her
          </Link>
        </p>
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
