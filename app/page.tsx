"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400"] });

export default function Home() {
  const [votes, setVotes] = useState(0);
  const [expandedBox, setExpandedBox] = useState<"for" | "mot" | null>(null);

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
        </div>

        {/* Stem-knapp */}
        <div className="flex flex-col justify-center items-center">
          <Link
            href="/login"
            className="bg-blue-500 text-white px-14 py-6 rounded-xl text-2xl font-bold hover:bg-blue-600 transform hover:scale-105 transition-all shadow-lg"
          >
            STEM
          </Link>
          <p className="text-xs text-blue-200 mt-3">Du må logge inn for å stemme</p>
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
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-blue-200 text-lg">
        Totalt stemmer så langt: <span className="font-semibold">{votes}</span>
      </footer>
    </main>
  );
}
