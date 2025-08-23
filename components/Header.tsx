"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { getCurrentUser, logoutUser } from "@/lib/users";
import { useState, useEffect } from "react";

const poppins = Poppins({ subsets: ["latin"], weight: ["600"] });

export default function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [setUser]);

  function handleLogout() {
    logoutUser();
    setUser(null);
    if (typeof window !== "undefined") {
      try {
        window.location.href = "/"; // refresh forsiden
      } catch {}
    }
  }

  return (
    <header className="flex justify-between items-center max-w-6xl mx-auto py-6 px-4">
      {/* Logo */}
      <Link href="/" className={`${poppins.className} flex items-center gap-2 text-2xl font-bold text-blue-400`}>
        <span className="w-7 h-7 rounded-full border-2 border-blue-400 flex items-center justify-center text-blue-400">✔</span>
        StemNorge
      </Link>

      {!user ? (
        <nav className="flex gap-6 text-lg text-blue-100">
          <Link href="/login" className="hover:text-blue-400">Login</Link>
          <Link href="/register" className="hover:text-blue-400">Registrer</Link>
          <Link href="/historie" className="hover:text-blue-400">Historie</Link>
          <Link href="/gdpr" className="hover:text-blue-400">GDPR</Link>
        </nav>
      ) : (
        <div className="flex gap-4 items-center">
          <span className="text-blue-200">Velkommen, {user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-blue-600 px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Logg ut
          </button>
        </div>
      )}
    </header>
  );
}
