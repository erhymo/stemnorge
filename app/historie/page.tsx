"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Topic = {
  id: string;
  title: string;
  date: string;
};

export default function HistoriePage() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // Dummy-data
    setTopics([
      { id: "1", title: "Skal vi bygge ut kjernekraft i Norge?", date: "11.08.2025" },
      { id: "2", title: "Bør Norge tillate flere elfly på kortbanenettet?", date: "28.07.2025" },
    ]);
  }, []);

  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold mb-8">Tidligere saker</h1>
      <ul className="space-y-4">
        {topics.map((t) => (
          <li key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-700 transition">
            <Link href={`/historie/${t.id}`} className="text-blue-400 hover:underline text-lg font-semibold">
              {t.title}
            </Link>
            <p className="text-sm text-blue-200">Dato: {t.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
