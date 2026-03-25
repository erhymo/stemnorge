"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Skriv inn e-postadressen din.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setMessage(data.error || "Noe gikk galt.");
      }
    } catch {
      setMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-xl md:rounded-[2rem] md:p-8">
          <div className="text-5xl">📧</div>
          <h1 className="text-2xl text-white">Sjekk e-posten din</h1>
          <p className="text-slate-300">
            Hvis det finnes en konto knyttet til <span className="font-semibold text-cyan-200">{email}</span>,
            har vi sendt en lenke for å tilbakestille passordet ditt.
          </p>
          <p className="text-sm text-slate-400">Lenken er gyldig i 1 time.</p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Tilbake til innlogging
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl md:rounded-[2rem] md:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl text-white">Glemt passord</h1>
          <p className="text-sm text-slate-400">Skriv inn e-postadressen din, så sender vi en lenke for å tilbakestille passordet.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sender..." : "Send tilbakestillingslenke"}
          </button>
        </form>

        {message && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
        )}

        <p className="text-sm text-slate-400">
          <Link href="/login" className="font-medium text-cyan-200 transition hover:text-white">
            ← Tilbake til innlogging
          </Link>
        </p>
      </div>
    </div>
  );
}

