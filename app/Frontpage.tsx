"use client";
import React, { useMemo, useState } from "react";

// --- Types ---
type Leg = {
  event: string;
  market: string;
  pick: string;
  odds: number;
  kickoff?: string;
  analysis?: string;
  legStatus?: "offen"|"gewonnen"|"verloren";
};
type Tip = {
  id: number;
  sport: string;
  league?: string;
  event?: string;
  combo: boolean;
  status: "offen"|"gewonnen"|"verloren";
  analysis?: string;
  kickoff?: string;
  legs: Leg[];
};

// ---- Deine Tipps hier als Array einfügen ----
const tips: Tip[] = [
  // Beispiele:
  {
    id: 1,
    sport: "Football",
    league: "Bundesliga",
    event: "FC Bayern vs BVB",
    combo: false,
    status: "gewonnen",
    legs: [
      {
        event: "FC Bayern vs BVB",
        market: "1X2",
        pick: "Bayern",
        odds: 1.95,
        legStatus: "gewonnen"
      }
    ]
  },
  {
    id: 2,
    sport: "Football",
    league: "Premier League",
    event: "",
    combo: true,
    status: "verloren",
    legs: [
      {
        event: "Man City vs Chelsea",
        market: "Over/Under 2.5",
        pick: "Over 2.5",
        odds: 1.8,
        legStatus: "gewonnen"
      },
      {
        event: "Liverpool vs Arsenal",
        market: "1X2",
        pick: "Unentschieden",
        odds: 3.4,
        legStatus: "verloren"
      }
    ]
  },
  // ...mehr Tipps
];

function formatDate(str?: string): string {
  if (!str) return "--.-- --:--";
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  return str;
}

export default function Frontpage() {
  const [statusFilter, setStatusFilter] = useState<"alle"|"offen"|"gewonnen"|"verloren">("alle");

  const gefilterteTips = useMemo(() => {
    if (statusFilter === "alle") return tips;
    return tips.filter(t => t.status === statusFilter);
  }, [statusFilter]);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-extrabold mb-6">Projekt Parlays – Alle Tipps</h1>
      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={()=>setStatusFilter("alle")} className={statusFilter==="alle" ? "bg-blue-800 text-white px-3 py-1 rounded-full font-bold" : "bg-neutral-700 px-3 py-1 rounded-full"}>Alle</button>
        <button onClick={()=>setStatusFilter("offen")} className={statusFilter==="offen" ? "bg-yellow-700 text-white px-3 py-1 rounded-full font-bold" : "bg-neutral-700 px-3 py-1 rounded-full"}>Offen</button>
        <button onClick={()=>setStatusFilter("gewonnen")} className={statusFilter==="gewonnen" ? "bg-green-700 text-white px-3 py-1 rounded-full font-bold" : "bg-neutral-700 px-3 py-1 rounded-full"}>Gewonnen</button>
        <button onClick={()=>setStatusFilter("verloren")} className={statusFilter==="verloren" ? "bg-red-700 text-white px-3 py-1 rounded-full font-bold" : "bg-neutral-700 px-3 py-1 rounded-full"}>Verloren</button>
      </div>
      {/* Tipp-Karten */}
      <div className="space-y-5">
        {gefilterteTips.length === 0 && (
          <div className="p-6 text-center text-neutral-400">Keine Tipps in dieser Kategorie.</div>
        )}
        {gefilterteTips.map(tip => (
          <div key={tip.id} className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 shadow flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{tip.combo ? "Kombi" : "Einzel"} · {tip.league}</span>
              {tip.status === "gewonnen" && <span className="bg-green-700 text-green-200 px-2 py-0.5 rounded-full text-xs font-bold">Gewonnen</span>}
              {tip.status === "verloren" && <span className="bg-red-700 text-red-200 px-2 py-0.5 rounded-full text-xs font-bold">Verloren</span>}
              {tip.status === "offen" && <span className="bg-yellow-700 text-yellow-200 px-2 py-0.5 rounded-full text-xs font-bold">Offen</span>}
            </div>
            {tip.combo ? (
              <div className="flex flex-col gap-1">
                {tip.legs.map((leg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold">{leg.event}</span>
                    <span className="text-xs">{leg.market}: {leg.pick} @ {leg.odds}</span>
                    {leg.legStatus === "gewonnen" && <span className="bg-green-700 text-green-100 px-2 py-0.5 rounded-full text-xs font-bold">✔</span>}
                    {leg.legStatus === "verloren" && <span className="bg-red-700 text-red-100 px-2 py-0.5 rounded-full text-xs font-bold">✗</span>}
                    {(!leg.legStatus || leg.legStatus === "offen") && <span className="bg-yellow-700 text-yellow-100 px-2 py-0.5 rounded-full text-xs font-bold">?</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold">{tip.legs[0].event}</span>
                <span className="text-xs">{tip.legs[0].market}: {tip.legs[0].pick} @ {tip.legs[0].odds}</span>
              </div>
            )}
            {tip.analysis && (
              <div className="mt-2 bg-neutral-800 rounded p-2 text-yellow-100 text-sm">{tip.analysis}</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
