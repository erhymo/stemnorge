"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import Turnstile from "@/components/Turnstile";

const TURNSTILE_SITE_KEY = "0x4AAAAAACvZnUiXTf3IqMWF";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Fyll ut alle felter.");
      return;
    }

    if (password.length < 8) {
      setMessage("Passord må være minst 8 tegn.");
      return;
    }

    if (!acceptedPrivacy) {
      setMessage("Du må bekrefte at du har lest personverninformasjonen.");
      return;
    }

    if (!turnstileToken) {
      setMessage("Vennligst fullfør verifiseringen (ikke en robot).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, turnstileToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegistered(true);
        return;
      }

      setMessage(data.error || "Registrering feilet");
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 text-center shadow-xl">
          <div className="text-5xl">📧</div>
          <h1 className="text-2xl text-white">Sjekk e-posten din</h1>
          <p className="text-slate-300">
            Vi har sendt en verifiseringslenke til <span className="font-semibold text-cyan-200">{email}</span>.
            Klikk på lenken i e-posten for å aktivere kontoen din.
          </p>
          <p className="text-sm text-slate-400">
            Sjekk søppelpost-mappen hvis du ikke finner e-posten.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Gå til innlogging
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Registrering</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Opprett konto for å delta i ukens avstemning</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Opprett en konto med e-post og passord for å sikre én stemme per person. Selve stemmevalget
          vises ikke offentlig per bruker.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• fullt navn brukes til kontoadministrasjon</li>
          <li>• e-post brukes til innlogging</li>
          <li>• passordet lagres kryptert</li>
          <li>• stemmehistorikk skal ikke være offentlig knyttet til deg</li>
        </ul>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl text-white">Opprett konto</h2>
          <p className="text-sm leading-7 text-slate-400">Fyll inn navn, e-post og et passord for å komme i gang.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Fullt navn</span>
            <input
              type="text"
              placeholder="Navn Etternavn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">E-post</span>
            <input
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Passord</span>
            <input
              type="password"
              placeholder="Minst 8 tegn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
            />
            <span>
              Jeg har lest <Link href="/gdpr" className="text-cyan-200 hover:text-white">personverninformasjonen</Link> og forstår hvordan kontoen min brukes.
            </span>
          </label>

          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
          />

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className="mt-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Registrerer..." : "Opprett konto"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
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
