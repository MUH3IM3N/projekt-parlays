"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Trash2, PlusCircle, MinusCircle, ShieldCheck, Eye, Check, XCircle, Clock } from "lucide-react";

const LEAGUES = [
  // ... wie gehabt ...
  "Bundesliga", "2. Bundesliga", "3. Liga", "DFB-Pokal",
  "Premier League", "Championship (England)", "FA Cup",
  "La Liga", "Segunda División (Spanien)", "Copa del Rey",
  "Serie A", "Serie B (Italien)", "Coppa Italia",
  "Ligue 1", "Ligue 2 (Frankreich)", "Coupe de France",
  "Süper Lig", "Eredivisie (Niederlande)", "Jupiler Pro League (Belgien)", "Super League (Schweiz)", "Austrian Bundesliga",
  "Primeira Liga (Portugal)", "Champions League", "Europa League", "Conference League",
  "WM", "EM", "Afrika Cup", "Copa America", "MLS (USA)", "Brasileirao",
  "Andere internationale Liga", "Freundschaftsspiel", "Eigene Liga eintragen...",
];

type Leg = {
  league: string;
  customLeague?: string;
  event: string;
  market: string;
  pick: string;
  odds: string;
  analysis: string;
  kickoff: string;
  legStatus?: "offen" | "gewonnen" | "verloren";
};
type Tip = {
  id: number;
  sport: string;
  combo: boolean;
  status: "offen" | "abgeschlossen" | "gewonnen" | "verloren";
  legs: Leg[];
};

export default function AdminPage() {
  // ...States wie gehabt...
  const [pwInput, setPwInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tip, setTip] = useState({
    sport: "Football",
    combo: false,
    status: "offen",
    legs: [
      {
        league: LEAGUES[0],
        customLeague: "",
        event: "",
        market: "",
        pick: "",
        odds: "",
        analysis: "",
        kickoff: "",
        legStatus: "offen",
      }
    ] as Leg[],
  });
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin-logged-in") === "yes") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/tips").then((res) => res.json()).then(setAllTips);
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === "parlays123") {
      setIsLoggedIn(true);
      setLoginError("");
      localStorage.setItem("admin-logged-in", "yes");
    } else {
      setLoginError("Falsches Passwort!");
    }
  };

  const handleLegChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTip((prev) => {
      const newLegs = prev.legs.map((leg, i) =>
        i === idx
          ? {
              ...leg,
              [name]: value,
              ...(name === "league" && value !== "Eigene Liga eintragen..."
                ? { customLeague: "" }
                : {}),
            }
          : leg
      );
      return { ...prev, legs: newLegs };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    if (name === "combo") {
      setTip((prev) => ({
        ...prev,
        combo: (e.target as HTMLInputElement).checked,
        legs:
          (e.target as HTMLInputElement).checked && prev.legs.length === 1
            ? [
                { ...prev.legs[0] },
                {
                  league: LEAGUES[0],
                  customLeague: "",
                  event: "",
                  market: "",
                  pick: "",
                  odds: "",
                  analysis: "",
                  kickoff: "",
                  legStatus: "offen",
                },
              ]
            : prev.legs,
      }));
    } else {
      setTip((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).value }));
    }
  };

  const addLeg = () => {
    setTip((prev) => ({
      ...prev,
      legs: [
        ...prev.legs,
        {
          league: LEAGUES[0],
          customLeague: "",
          event: "",
          market: "",
          pick: "",
          odds: "",
          analysis: "",
          kickoff: "",
          legStatus: "offen",
        },
      ],
    }));
  };

  const removeLeg = (idx: number) => {
    setTip((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const preparedLegs = tip.legs.map((leg) => ({
      ...leg,
      league: leg.league === "Eigene Liga eintragen..." ? leg.customLeague || "" : leg.league,
      odds: parseFloat(String(leg.odds)),
      legStatus: leg.legStatus || "offen",
    }));
    const newTip = {
      sport: tip.sport,
      combo: tip.combo,
      status: tip.status,
      legs: preparedLegs,
      id: Date.now(),
    };
    const res = await fetch("/api/tips/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTip),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("✔️ Tipp gespeichert!");
      setTip({
        sport: "Football",
        combo: false,
        status: "offen",
        legs: [
          {
            league: LEAGUES[0],
            customLeague: "",
            event: "",
            market: "",
            pick: "",
            odds: "",
            analysis: "",
            kickoff: "",
            legStatus: "offen",
          },
        ],
      });
      fetch("/api/tips").then((res) => res.json()).then(setAllTips);
    } else {
      setMessage("❌ Fehler beim Speichern!");
    }
  };

  // STATUS UPDATE HANDLER (Tipp-Gesamt)
  const updateStatus = async (id: number, newStatus: Tip["status"]) => {
    await fetch("/api/tips/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetch("/api/tips").then((res) => res.json()).then(setAllTips);
  };

  // NEU: Leg-Status-Update (nur für Kombis)
  const updateLegStatus = async (tipId: number, legIdx: number, newStatus: "gewonnen"|"verloren"|"offen") => {
    const tip = allTips.find(t => t.id === tipId);
    if (!tip) return;
    const updatedLegs = tip.legs.map((leg, idx) =>
      idx === legIdx ? { ...leg, legStatus: newStatus } : leg
    );
    await fetch("/api/tips/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tipId, legs: updatedLegs }),
    });
    fetch("/api/tips").then((res) => res.json()).then(setAllTips);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch("/api/tips/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    setAllTips((tips) => tips.filter((t) => t.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-logged-in");
    setIsLoggedIn(false);
  };

  const getKombiQuote = () => {
    if (!tip.combo || tip.legs.length < 2) return null;
    let sum = 1;
    for (const l of tip.legs) {
      const o = parseFloat(l.odds as string);
      if (!isNaN(o) && o > 0) sum *= o;
    }
    return sum.toFixed(2);
  };

  // LOGIN SCREEN (wie gehabt) ...

  if (!isLoggedIn) {
    // ... Login-UI bleibt wie gehabt ...
  }

  // MAIN PANEL
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#181e1e] to-[#00d2be11] p-8">
      <div className="max-w-3xl mx-auto glass border border-[#00d2be33] shadow-2xl rounded-3xl p-7 mt-8">
        {/* ...Form wie gehabt... */}
        <h2 className="text-xl font-bold mt-10 mb-3 text-neutral-300">Bereits eingetragene Tipps</h2>
        <ul className="space-y-3">
          {allTips.map((t) => (
            <li key={t.id} className="flex flex-col md:flex-row justify-between items-start bg-[#181e1e] rounded-xl p-4 border border-[#00d2be22]">
              <div>
                <strong>{t.combo ? "Kombi" : "Einzel"} - {t.sport === "Football" ? "Fußball" : t.sport}</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {t.legs.map((leg: Leg, i: number) => (
                    <span key={i} className="block px-2 py-1 rounded bg-[#00d2be22] text-[#00d2be] font-bold">
                      {leg.event} | {leg.league} | {leg.market} | {leg.pick} @ {leg.odds} | {leg.kickoff} <br />
                      <span className="text-neutral-300 font-normal">{leg.analysis}</span>
                      {/* Leg-Status Buttons */}
                      {t.combo && (
                        <span className="ml-2 flex gap-1 items-center">
                          <button
                            onClick={() => updateLegStatus(t.id, i, "gewonnen")}
                            className={`px-1 py-0.5 rounded bg-green-700 text-white text-xs font-bold flex items-center gap-1 ${leg.legStatus === "gewonnen" ? "" : "opacity-60"}`}
                          ><Check size={14}/></button>
                          <button
                            onClick={() => updateLegStatus(t.id, i, "verloren")}
                            className={`px-1 py-0.5 rounded bg-red-700 text-white text-xs font-bold flex items-center gap-1 ${leg.legStatus === "verloren" ? "" : "opacity-60"}`}
                          ><XCircle size={14}/></button>
                          <button
                            onClick={() => updateLegStatus(t.id, i, "offen")}
                            className={`px-1 py-0.5 rounded bg-blue-700 text-white text-xs font-bold flex items-center gap-1 ${leg.legStatus === "offen" ? "" : "opacity-60"}`}
                          ><Clock size={14}/></button>
                          <span className="text-xs font-bold ml-1"
                            style={{
                              color:
                                leg.legStatus === "gewonnen" ? "#16a34a" :
                                leg.legStatus === "verloren" ? "#ef4444" : "#00d2be"
                            }}>
                            {leg.legStatus === "gewonnen" ? "✔" : leg.legStatus === "verloren" ? "✗" : ""}
                          </span>
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {/* Status-Button-Bar für Gesamtschein */}
                <div className="flex gap-2 mt-2">
                  <span className="ml-0 px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor:
                        t.status === "gewonnen"
                          ? "#16a34a"
                          : t.status === "verloren"
                          ? "#ef4444"
                          : t.status === "abgeschlossen"
                          ? "#d4d4d8"
                          : "#2563eb",
                      color: t.status === "abgeschlossen" ? "#111" : "#fff",
                    }}
                  >
                    {t.status}
                  </span>
                  <button
                    onClick={() => updateStatus(t.id, "offen")}
                    disabled={t.status === "offen"}
                    className={`px-2 py-1 rounded bg-[#2563eb] text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition ${t.status === "offen" ? "opacity-50" : ""}`}
                  ><Clock size={14}/> Offen</button>
                  <button
                    onClick={() => updateStatus(t.id, "gewonnen")}
                    disabled={t.status === "gewonnen"}
                    className={`px-2 py-1 rounded bg-green-700 text-white text-xs font-bold flex items-center gap-1 hover:bg-green-800 transition ${t.status === "gewonnen" ? "opacity-50" : ""}`}
                  ><Check size={14}/> Gewonnen</button>
                  <button
                    onClick={() => updateStatus(t.id, "verloren")}
                    disabled={t.status === "verloren"}
                    className={`px-2 py-1 rounded bg-red-700 text-white text-xs font-bold flex items-center gap-1 hover:bg-red-800 transition ${t.status === "verloren" ? "opacity-50" : ""}`}
                  ><XCircle size={14}/> Verloren</button>
                </div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deleting === t.id}
                className="text-red-400 hover:text-red-600 font-bold ml-0 md:ml-4 mt-2 md:mt-0"
              >
                {deleting === t.id ? "Lösche..." : <><Trash2 className="inline mr-1" size={16} /> Löschen</>}
              </button>
            </li>
          ))}
          {allTips.length === 0 && (
            <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>
          )}
        </ul>
      </div>
      <style>{`
        .glass {
          background: rgba(24,32,34,0.93);
          backdrop-filter: blur(7px) saturate(120%);
        }
      `}</style>
    </main>
  );
}
