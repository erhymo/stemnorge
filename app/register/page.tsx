"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { notifySessionChanged, saveSession } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode() {
    setMessage("");

    if (!name || !phone) {
      setMessage("Fyll ut navn og telefonnummer før du ber om SMS-kode.");
      return;
    }

    if (!acceptedPrivacy) {
      setMessage("Du må bekrefte at du har lest personverninformasjonen.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Sender SMS-kode...");

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "register" }),
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
          : "SMS-kode sendt. Skriv inn koden for å fullføre registreringen.",
      );
    } catch {
      setMessage("Noe gikk galt under utsending av SMS-kode.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!name || !phone || !code) {
      setMessage("Fyll ut alle felter");
      return;
    }

    if (!acceptedPrivacy) {
      setMessage("Du må bekrefte at du har lest personverninformasjonen.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, code }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        saveSession(data.token, data.user);
        notifySessionChanged();
        setMessage("Registrering vellykket! Du logges inn nå...");
        router.push("/vote");
        router.refresh();
        return;
      }

      setMessage(data.error || "Registrering feilet");
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Registrering</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Opprett konto for å delta i ukens avstemning</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          I V1 bruker vi mobilnummer og SMS-verifisering for å sikre én konto per person. Det gjør det enklere å
          holde stemmegivningen ryddig, samtidig som selve stemmevalget ikke skal vises offentlig per bruker.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• fullt navn brukes til kontoadministrasjon</li>
          <li>• mobilnummer brukes til innlogging og verifisering</li>
          <li>• du logger inn automatisk etter godkjent SMS-kode</li>
          <li>• stemmehistorikk skal ikke være offentlig knyttet til deg</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl text-white">Opprett konto</h2>
          <p className="text-sm leading-7 text-slate-400">Vi sender en engangskode på SMS for å bekrefte nummeret ditt.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Fullt navn</span>
            <input
              type="text"
              placeholder="Navn Etternavn"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setCode("");
                setDevCode("");
                setHasRequestedCode(false);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Telefonnummer</span>
            <input
              type="tel"
              placeholder="f.eks. 900 00 000"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCode("");
                setDevCode("");
                setHasRequestedCode(false);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          {hasRequestedCode && (
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block">SMS-kode</span>
              <input
                inputMode="numeric"
                placeholder="Skriv inn 6-sifret kode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
              />
            </label>
          )}

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked);
                setCode("");
                setDevCode("");
                setHasRequestedCode(false);
              }}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
            />
            <span>
              Jeg har lest <Link href="/gdpr" className="text-cyan-200 hover:text-white">personverninformasjonen</Link> og forstår hvorfor mobilnummer brukes i kontoen.
            </span>
          </label>

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
            {isSubmitting && hasRequestedCode ? "Registrerer..." : "Bekreft og opprett konto"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
        )}

        {devCode && (
          <p className="mt-3 text-xs text-cyan-200/80">Utviklingsmodus: bruk koden {devCode} hvis ingen ekte SMS-leverandør er satt opp.</p>
        )}

        <p className="mt-6 text-sm text-slate-400">
          Har du allerede konto?{" "}
          <Link href="/login?next=/vote" className="font-medium text-cyan-200 transition hover:text-white">
            Logg inn her
          </Link>
        </p>
      </section>
    </div>
  );
}
