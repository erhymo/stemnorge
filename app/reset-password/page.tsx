"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!password || password.length < 8) {
      setMessage("Passordet må være minst 8 tegn.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passordene stemmer ikke overens.");
      return;
    }

    if (!token) {
      setMessage("Ugyldig tilbakestillingslenke.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setMessage(data.error || "Kunne ikke tilbakestille passordet.");
      }
    } catch {
      setMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-xl md:rounded-[2rem] md:p-8">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl text-white">Passordet er oppdatert</h1>
          <p className="text-slate-300">Du kan nå logge inn med det nye passordet ditt.</p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Logg inn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl md:rounded-[2rem] md:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl text-white">Nytt passord</h1>
          <p className="text-sm text-slate-400">Velg et nytt passord for kontoen din.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Nytt passord</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tegn"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Bekreft passord</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Gjenta passordet"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Oppdaterer..." : "Sett nytt passord"}
          </button>
        </form>

        {message && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center justify-center px-6 py-12 text-slate-300">
          Laster...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

