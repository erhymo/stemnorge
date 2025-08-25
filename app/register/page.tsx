"use client";

import { useState } from "react";
import { Poppins, Inter } from "next/font/google";
import { addUser } from "@/lib/users";

const poppins = Poppins({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400"] });

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage("");
      if (!name || !email || !password) {
        setMessage("Fyll ut alle felter");
        return;
      }
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("Registrering vellykket! Du kan nå logge inn.");
          setName("");
          setEmail("");
          setPassword("");
        } else {
          setMessage(data.error || "Registrering feilet");
        }
      } catch {
        setMessage("Noe gikk galt");
      }
  }

  return (
    <main
      className={`${inter.className} flex flex-col items-center justify-center min-h-screen p-6 text-white bg-gradient-to-br from-slate-900 to-slate-800`}
    >
      <div className={`${poppins.className} flex items-center gap-2 text-3xl font-bold text-blue-400 mb-12`}>
        <span className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center text-blue-400">
          ✔
        </span>
        StemNorge
      </div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg">
        <h1 className={`${poppins.className} text-2xl font-bold text-center mb-8`}>
          Registrer deg
        </h1>

        <form className="flex flex-col gap-6" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Fullt navn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-600 transform hover:scale-105 transition-all"
          >
            Registrer
          </button>
        </form>
        {message && (
          <p className="text-center text-sm text-blue-200 mt-4">{message}</p>
        )}

        <p className="text-center text-sm text-blue-200 mt-6">
          Har du allerede en konto?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Logg inn her
          </a>
        </p>
      </div>
    </main>
  );
}
