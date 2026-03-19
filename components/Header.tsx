"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearSession,
  getStoredUser,
  notifySessionChanged,
  SESSION_CHANGED_EVENT,
  type SessionUser,
} from "@/lib/session";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setUser(getStoredUser());
    };

    syncSession();

    window.addEventListener("storage", syncSession);
    window.addEventListener(SESSION_CHANGED_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(SESSION_CHANGED_EVENT, syncSession);
    };
  }, []);

  function handleLogout() {
    clearSession();
    notifySessionChanged();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
            SN
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">StemNorge</span>
            <span className="block text-xs text-slate-400">Ukentlig folkestemme, presentert ryddig</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
          <Link href="/" className="transition hover:text-white">Ukens sak</Link>
          <Link href="/historie" className="transition hover:text-white">Historikk</Link>
          <Link href="/gdpr" className="transition hover:text-white">Personvern</Link>

          {user ? (
            <>
              <Link href="/vote" className="transition hover:text-white">Stem</Link>
              <span className="text-slate-400">{user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-cyan-300/40 hover:bg-white/5"
              >
                Logg ut
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="transition hover:text-white">Logg inn</Link>
              <Link href="/register" className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-cyan-300/40 hover:bg-white/5">
                Registrer deg
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
