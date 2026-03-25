"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  clearSession,
  getStoredUser,
  notifySessionChanged,
  SESSION_CHANGED_EVENT,
  type SessionUser,
} from "@/lib/session";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    notifySessionChanged();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
            SN
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">StemNorge</span>
            <span className="block text-xs text-slate-400">Ukentlig folkestemme, presentert ryddig</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
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

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Lukk meny" : "Åpne meny"}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/5 md:hidden"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-slate-950/95 px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/" className="rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5">Ukens sak</Link>
            <Link href="/historie" className="rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5">Historikk</Link>
            <Link href="/gdpr" className="rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5">Personvern</Link>

            {user ? (
              <>
                <Link href="/vote" className="rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5">Stem</Link>
                <div className="my-2 border-t border-white/10" />
                <span className="px-4 py-2 text-sm text-slate-400">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 rounded-full border border-white/10 px-4 py-3 text-sm text-white transition hover:border-cyan-300/40 hover:bg-white/5"
                >
                  Logg ut
                </button>
              </>
            ) : (
              <>
                <div className="my-2 border-t border-white/10" />
                <Link href="/login" className="rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5">Logg inn</Link>
                <Link href="/register" className="mt-1 rounded-full border border-white/10 px-4 py-3 text-center text-sm text-white transition hover:border-cyan-300/40 hover:bg-white/5">
                  Registrer deg
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
