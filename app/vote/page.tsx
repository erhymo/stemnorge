
"use client";

import { useRouter } from "next/navigation";
import { getCurrentUser, addVote } from "@/lib/users";
import { useEffect, useState } from "react";

export default function VotePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  function handleVote(choice: "for" | "mot") {
    if (!user) return;
    const ok = addVote("current-topic", choice, user.phone);
    if (ok) router.push("/thanks");
    else alert("Du har allerede stemt i denne saken.");
  }

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-3xl font-bold mb-8">Hva stemmer du?</h1>
      <div className="flex gap-6">
        <button
          onClick={() => handleVote("for")}
          className="bg-green-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-600"
        >
          For
        </button>
        <button
          onClick={() => handleVote("mot")}
          className="bg-red-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-600"
        >
          Mot
        </button>
      </div>
    </div>
  );
}
