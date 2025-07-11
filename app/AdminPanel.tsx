"use client";
import React, { useState } from "react";

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

// ---- Deine Tipps HIER reinkopieren (z.B. aus Frontpage exportieren/kopieren) ----
const initialAdminTips: Tip[] = [
  // Beispiele wie oben, einfach deine Tipps als Array einfügen!
];

export default function AdminPanel() {
  const [adminTips, setAdminTips] = useState<Tip[]>(initialAdminTips);

  const setStatus = (tipId: number, status: "offen"|"gewonnen"|"verloren") => {
    setAdminTips(tips =>
      tips.map(t =>
        t.id === tipId ? { ...t, status } : t
      )
    );
  };

  const setLegStatus = (tipId: number, legIdx: number, legStatus: "offen"|"gewonnen"|"verloren") => {
    setAdminTips(tips =>
      tips.map(t =>
        t.id === tipId
          ? { ...t, legs: t.legs.map((l, idx) => idx === legIdx ? { ...l, legStatus } : l) }
          : t
      )
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(adminTips, null, 2));
    alert("JSON kopiert! Füge es in deine Datei ein.");
  };

  return (
    <div className="max-w-3xl mx-auto my-10 p-4 bg-neutral-900 rounded-lg text-neutral-100 shadow-lg">
      <h2 className="text-2xl font-bold mb-5">Admin Panel – Statusverwaltung</h2>
      <button onClick={handleCopy} className="mb-4 bg-blue-800 text-white px-4 py-2 rounded font-bold">Geänderte Tipps als JSON kopieren</button>
      <div className="space-y-6">
        {adminTips.map((tip) => (
          <div key={tip.id} className="p-4 rounded border border-neutral-700 mb-2 bg-neutral-800">
            <div className="flex items-center gap-4 mb-2">
              <span className="font-bold">{tip.combo ? "Kombi" : "Einzel"} · {tip.league} · {tip.legs[0]?.kickoff}</span>
              <select value={tip.status} onChange={e=>setStatus(tip.id, e.target.value as "offen"|"gewonnen"|"verloren")} className="ml-auto bg-neutral-700 text-white px-2 py-1 rounded">
                <option value="offen">Offen</option>
                <option value="gewonnen">Gewonnen</option>
                <option value="verloren">Verloren</option>
              </select>
            </div>
            {tip.combo ? (
              <div className="flex flex-col gap-1">
                {tip.legs.map((leg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold">{leg.event}</span>
                    <span className="text-xs">{leg.market}: {leg.pick} @ {leg.odds}</span>
                    <select value={leg.legStatus} onChange={e=>setLegStatus(tip.id, idx, e.target.value as "offen"|"gewonnen"|"verloren")} className="bg-neutral-700 text-white px-1 py-0.5 rounded ml-2">
                      <option value="offen">?</option>
                      <option value="gewonnen">✔</option>
                      <option value="verloren">✗</option>
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold">{tip.legs[0]?.event}</span>
                <span className="text-xs">{tip.legs[0]?.market}: {tip.legs[0]?.pick} @ {tip.legs[0]?.odds}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
