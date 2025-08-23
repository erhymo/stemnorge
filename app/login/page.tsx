"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins, Inter } from "next/font/google";
import { validateUser, loginUser } from "@/lib/users";

const poppins = Poppins({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400"] });

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const user = validateUser(phone, password);

    if (user) {
      loginUser(user);
      router.push("/"); // send til forsiden
    } else {
      setMessage("Feil telefonnummer eller passord");
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
          Logg inn
        </h1>

        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder="Telefonnummer"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            Logg inn
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-blue-200 mt-4">{message}</p>
        )}

        <p className="text-center text-sm text-blue-200 mt-6">
          Har du ikke konto?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Registrer deg her
          </a>
        </p>
      </div>
    </main>
  );
}
