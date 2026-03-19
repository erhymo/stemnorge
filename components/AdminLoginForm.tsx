"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminLoginFormProps = {
  isConfigured: boolean;
};

export default function AdminLoginForm({ isConfigured }: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfigured) {
      setMessage("Admin-innlogging er ikke konfigurert ennå.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Kunne ikke logge inn som admin.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setMessage("Noe gikk galt under admin-innlogging.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl text-white">Admin-innlogging</h2>
        <p className="text-sm leading-7 text-slate-400">
          Denne flaten er nå beskyttet med en separat admin-session i cookie.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Brukernavn</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Admin-passord</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Skriv inn admin-passord"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !isConfigured}
          className="mt-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Logger inn..." : "Logg inn som admin"}
        </button>
      </form>

      {!isConfigured ? (
        <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Sett `ADMIN_PASSWORD` i miljøet for å aktivere admin-innlogging.
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>
      ) : null}
    </section>
  );
}