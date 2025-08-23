"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getVotesForTopic } from "@/lib/users";

export default function HistorieDetaljPage() {
  const { id } = useParams();
  const [votesFor, setVotesFor] = useState(0);
  const [votesMot, setVotesMot] = useState(0);

  useEffect(() => {
    const votes = getVotesForTopic(id as string);
    setVotesFor(votes.filter((v) => v.choice === "for").length);
    setVotesMot(votes.filter((v) => v.choice === "mot").length);
  }, [id]);

  const total = votesFor + votesMot;
  const percentFor = total > 0 ? Math.round((votesFor / total) * 100) : 0;
  const percentMot = total > 0 ? Math.round((votesMot / total) * 100) : 0;

  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold mb-6">Sak #{id}</h1>

      <h2 className="text-xl font-semibold mb-2">Argumenter for</h2>
      <p className="bg-blue-50 text-gray-900 rounded-lg p-4 mb-6">
        Rimelig energi, klimavennlig, stabil kraftforsyning…
      </p>

      <h2 className="text-xl font-semibold mb-2">Argumenter mot</h2>
      <p className="bg-blue-50 text-gray-900 rounded-lg p-4 mb-6">
        Avfallshåndtering, høye kostnader, sikkerhetsrisiko…
      </p>

      <h2 className="text-xl font-semibold mb-2">Resultat</h2>
      {total === 0 ? (
        <p className="text-blue-200">Ingen stemmer registrert ennå.</p>
      ) : (
        <p className="text-blue-200">
          For: {percentFor}% ({votesFor} stemmer) <br />
          Mot: {percentMot}% ({votesMot} stemmer)
        </p>
      )}
    </div>
  );
}
