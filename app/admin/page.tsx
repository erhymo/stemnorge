"use client";

import { useState } from "react";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pw, setPw] = useState("");
  const [title, setTitle] = useState("");
  const [forText, setForText] = useState("");
  const [motText, setMotText] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw === "Bringeland") {
      setIsLoggedIn(true);
    } else {
      setMessage("Feil passord");
    }
  }

  function handleNewTopic(e: React.FormEvent) {
    e.preventDefault();
    // Dummy: bare vis melding (senere lagres i Firebase)
    setMessage(`Ny sak opprettet: ${title}`);
    setTitle("");
    setForText("");
    setMotText("");
  }

  if (!isLoggedIn) {
    return (
      <div className="py-20 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Passord"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="px-4 py-3 rounded bg-slate-700 text-white"
          />
          <button className="bg-blue-500 py-3 rounded hover:bg-blue-600">Logg inn</button>
        </form>
        {message && <p className="mt-4 text-red-400">{message}</p>}
      </div>
    );
  }

  return (
    <div className="py-20 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Adminpanel</h1>
      <form onSubmit={handleNewTopic} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Tittel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-3 rounded bg-slate-700 text-white"
        />
        <textarea
          placeholder="Argumenter for"
          value={forText}
          onChange={(e) => setForText(e.target.value)}
          className="px-4 py-3 rounded bg-slate-700 text-white"
        />
        <textarea
          placeholder="Argumenter mot"
          value={motText}
          onChange={(e) => setMotText(e.target.value)}
          className="px-4 py-3 rounded bg-slate-700 text-white"
        />
        <button className="bg-green-500 py-3 rounded hover:bg-green-600">Lagre sak</button>
      </form>
      {message && <p className="mt-4 text-blue-400">{message}</p>}
    </div>
  );
}
