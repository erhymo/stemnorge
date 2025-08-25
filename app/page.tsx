"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400"] });

export default function Home() {
  const [votes, setVotes] = useState(0);
  const [forVotes, setForVotes] = useState(0);
  const [motVotes, setMotVotes] = useState(0);
  const [expandedBox, setExpandedBox] = useState<"for" | "mot" | null>(null);
  type User = { id: number; email: string; name: string };
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function fetchVotes() {
      const res = await fetch("/api/votes");
      const data = await res.json();
      setVotes(data.total);
      setForVotes(data.forVotes);
      setMotVotes(data.motVotes);
    }
    fetchVotes();
    const storedUser = window.localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  async function handleVote(value: "for" | "mot") {
    setMessage("");
    const token = window.localStorage.getItem("token");
    if (!token) {
      setMessage("Du må være innlogget for å stemme.");
      return;
    }
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, value })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Din stemme er registrert!");
        // Oppdater stemmetall
        const resVotes = await fetch("/api/votes");
        const dataVotes = await resVotes.json();
        setVotes(dataVotes.total);
        setForVotes(dataVotes.forVotes);
        setMotVotes(dataVotes.motVotes);
      } else {
        setMessage(data.error || "Kunne ikke registrere stemme.");
      }
    } catch {
      setMessage("Noe gikk galt");
    }
  }

  // Nedtelling
  // ...existing code...

  useEffect(() => {
    setVotes(1234); // dummy tall
  }, []);


  return (
    <main className={`${inter.className} flex flex-col items-center min-h-screen p-6 text-white bg-gradient-to-br from-slate-900 to-slate-800`}>

      {/* Tema */}
      <h1 className={`${poppins.className} text-4xl font-bold text-center mb-4`}>
        Skal vi bygge ut kjernekraft i Norge?
      </h1>

      {/* Stemmeseksjon */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-6xl items-start mt-12">
        {/* For-boks */}
        <div className="relative border rounded-xl p-6 bg-blue-50 text-gray-900 shadow-lg min-h-[400px] hover:shadow-blue-200 transition-shadow">
          <h2 className="text-xl font-bold mb-4">For</h2>
          <button
            className="absolute top-3 right-3 text-gray-500"
            onClick={() => setExpandedBox(expandedBox === "for" ? null : "for")}
          >
            {expandedBox === "for" ? "-" : "+"}
          </button>
          <p className={`text-sm leading-relaxed ${expandedBox === "for" ? "text-lg" : ""}`}>
            Argumentene for kjernekraft: Rimelig energi, klimavennlig, stabil kraftforsyning…
          </p>
          <div className="mt-6 text-blue-900 font-bold">Stemmer: {forVotes}</div>
        </div>

        {/* Stem-knapp */}
        <div className="flex flex-col justify-center items-center">
          {user ? (
            <>
              <button
                className="bg-blue-500 text-white px-14 py-6 rounded-xl text-2xl font-bold hover:bg-blue-600 transform hover:scale-105 transition-all shadow-lg mb-4"
                onClick={() => handleVote("for")}
              >
                STEM FOR
              </button>
              <button
                className="bg-blue-500 text-white px-14 py-6 rounded-xl text-2xl font-bold hover:bg-blue-600 transform hover:scale-105 transition-all shadow-lg"
                onClick={() => handleVote("mot")}
              >
                STEM MOT
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-500 text-white px-14 py-6 rounded-xl text-2xl font-bold hover:bg-blue-600 transform hover:scale-105 transition-all shadow-lg"
            >
              STEM
            </Link>
          )}
          <p className="text-xs text-blue-200 mt-3">{user ? "Du kan stemme én gang" : "Du må logge inn for å stemme"}</p>
          {message && <div className="text-red-400 mt-2">{message}</div>}
        </div>

        {/* Mot-boks */}
        <div className="relative border rounded-xl p-6 bg-blue-50 text-gray-900 shadow-lg min-h-[400px] hover:shadow-blue-200 transition-shadow">
          <h2 className="text-xl font-bold mb-4">Mot</h2>
          <button
            className="absolute top-3 right-3 text-gray-500"
            onClick={() => setExpandedBox(expandedBox === "mot" ? null : "mot")}
          >
            {expandedBox === "mot" ? "-" : "+"}
          </button>
          <p className={`text-sm leading-relaxed ${expandedBox === "mot" ? "text-lg" : ""}`}>
            Argumentene mot kjernekraft: Avfallshåndtering, høye kostnader, sikkerhetsrisiko…
          </p>
          <div className="mt-6 text-blue-900 font-bold">Stemmer: {motVotes}</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-blue-200 text-lg">
        Totalt stemmer så langt: <span className="font-semibold">{votes}</span>
      </footer>
    </main>
  );
}
