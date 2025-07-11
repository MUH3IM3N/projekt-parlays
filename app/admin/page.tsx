"use client";
import React, { useState, useEffect } from "react";
import {
  LogOut,
  Trash2,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  Eye,
  Check,
  XCircle,
  Clock,
} from "lucide-react";

const LEAGUES = [
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
  const [legMassUpdate, setLegMassUpdate] = useState<{ id: number, status: "gewonnen"|"verloren"|null }>({ id: -1, status: null });

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

  const updateStatus = async (id: number, newStatus: Tip["status"]) => {
    // Mass-update ALL LEGS if "gewonnen" or "verloren" is set
    if (newStatus === "gewonnen" || newStatus === "verloren") {
      const tip = allTips.find(t => t.id === id);
      if (tip) {
        setLegMassUpdate({ id, status: newStatus });
        const updatedLegs = tip.legs.map(l => ({ ...l, legStatus: newStatus }));
        await fetch("/api/tips/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus, legs: updatedLegs }),
        });
        setTimeout(() => setLegMassUpdate({ id: -1, status: null }), 800);
      }
    } else {
      await fetch("/api/tips/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    }
    fetch("/api/tips").then((res) => res.json()).then(setAllTips);
  };

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

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-[#001b1c] px-4">
        <div className="max-w-xs w-full glass p-8 rounded-3xl shadow-2xl border border-[#00d2be44]">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <ShieldCheck size={44} className="text-[#00D2BE] drop-shadow-xl animate-bounce" />
          </div>
          <h1 className="font-black text-2xl text-center text-[#00D2BE] tracking-widest mt-8">Projekt Parlays Admin Panel</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-5 mt-10">
            <label className="relative block">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Master-Passwort"
                value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                className="p-3 pl-11 w-full rounded-full bg-[#181e1e] text-[#00D2BE] text-lg font-semibold border border-[#00d2be88] outline-none focus:ring-2 focus:ring-[#00d2be] placeholder-[#00d2be88] shadow"
                autoFocus
              />
              <Eye
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00d2beaa] cursor-pointer hover:text-[#00d2be] transition"
                onClick={() => setShowPw((v) => !v)}
              />
            </label>
            <button className="flex items-center justify-center gap-2 bg-[#00D2BE] text-black font-black rounded-full py-3 text-lg shadow-lg hover:bg-[#05b9a7] transition" type="submit">
              <ShieldCheck /> Zugang
            </button>
            {loginError && <div className="text-center text-sm text-red-400">{loginError}</div>}
          </form>
        </div>
        <style>{`
          .glass {
            background: rgba(24,32,34,0.90);
            backdrop-filter: blur(7px) saturate(120%);
          }
        `}</style>
      </main>
    );
  }

  // --- MAIN PANEL ---
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#181e1e] to-[#00d2be11] p-8">
      <div className="max-w-3xl mx-auto glass border border-[#00d2be33] shadow-2xl rounded-3xl p-7 mt-8">
        <header className="flex items-center gap-4 mb-8">
          <h1 className="font-black text-3xl text-[#00D2BE] tracking-wide flex-1">Projekt Parlays Admin Panel</h1>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full bg-[#181e1e] hover:bg-[#262e2e] border border-[#00D2BE44] shadow-md">
            <LogOut className="text-[#00D2BE]" size={24} />
          </button>
        </header>
        {/* --- FORMULAR FÜR NEUEN TIPP --- */}
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-3 gap-3">
            <select name="sport" value={tip.sport} onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow">
              <option value="Football">Fußball</option>
              <option value="Tennis">Tennis</option>
            </select>
            <select name="status" value={tip.status} onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow">
              <option value="offen">Offen</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="gewonnen">Gewonnen</option>
              <option value="verloren">Verloren</option>
            </select>
            {tip.combo && tip.legs.length > 1 && (
              <div className="flex items-center gap-2 justify-end font-bold text-[#00D2BE]">
                KUMULIERTE QUOTE:&nbsp;
                <span className="bg-[#00D2BE] text-black px-3 py-1 rounded-lg shadow font-black text-lg">{getKombiQuote()}</span>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold">
            <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
            Kombi-Tipp?
          </label>

          {tip.legs.map((leg, idx) => (
            <div key={idx} className="border border-[#00d2be33] rounded-2xl bg-[#141a1a] p-5 mb-3 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="league"
                  value={leg.league}
                  onChange={e => handleLegChange(idx, e)}
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                >
                  {LEAGUES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {leg.league === "Eigene Liga eintragen..." && (
                  <input
                    name="customLeague"
                    value={leg.customLeague || ""}
                    onChange={e => handleLegChange(idx, e)}
                    placeholder="Liga eingeben"
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                  />
                )}
                <input
                  name="event"
                  placeholder="Event (z.B. Team A vs. Team B)"
                  value={leg.event}
                  onChange={e => handleLegChange(idx, e)}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name="kickoff"
                  placeholder="Kickoff (z.B. 2025-08-10T15:30)"
                  value={leg.kickoff}
                  onChange={e => handleLegChange(idx, e)}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="market"
                  placeholder="Markt (z.B. 1X2, Über/Unter...)"
                  value={leg.market}
                  onChange={e => handleLegChange(idx, e)}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name="pick"
                  placeholder="Tipp"
                  value={leg.pick}
                  onChange={e => handleLegChange(idx, e)}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name="odds"
                  placeholder="Quote"
                  type="number"
                  step="0.01"
                  value={leg.odds}
                  onChange={e => handleLegChange(idx, e)}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
              </div>
              <textarea
                name="analysis"
                value={leg.analysis}
                onChange={e => handleLegChange(idx, e)}
                placeholder="Kurze Analyse / Begründung (max. 240 Zeichen)"
                maxLength={240}
                className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
              />
              <div className="flex gap-4">
                {tip.legs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLeg(idx)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <MinusCircle /> Leg entfernen
                  </button>
                )}
                {idx === tip.legs.length - 1 && (
                  <button
                    type="button"
                    onClick={addLeg}
                    className="flex items-center gap-1 text-[#00D2BE] hover:text-[#0098aa]"
                  >
                    <PlusCircle /> Weiteres Spiel hinzufügen
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            className="flex items-center justify-center gap-2 bg-[#00D2BE] text-black font-bold rounded-xl px-6 py-3 text-lg shadow-lg hover:bg-[#05b9a7] transition w-full"
            type="submit"
            disabled={saving}
          >
            {saving ? "Speichern..." : "Tipp speichern"}
          </button>
          {message && <div className="text-center text-lg mt-2">{message}</div>}
        </form>

        {/* --- TIPP-ÜBERSICHT --- */}
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
                      {/* Leg-Status Buttons für Kombi */}
                      {t.combo && (
                        <span className="ml-2 flex gap-1 items-center">
                          <button
                            type="button"
                            onClick={() => updateLegStatus(t.id, i, "gewonnen")}
                            className={`px-1 py-0.5 rounded bg-green-700 text-white text-xs font-bold flex items-center gap-1 border-2 transition 
                              ${leg.legStatus === "gewonnen" ? "border-yellow-300 shadow-lg" : "border-transparent hover:border-green-300"}`}
                            style={{ cursor: "pointer", opacity: 1 }}
                            tabIndex={0}
                          ><Check size={14}/></button>
                          <button
                            type="button"
                            onClick={() => updateLegStatus(t.id, i, "verloren")}
                            className={`px-1 py-0.5 rounded bg-red-700 text-white text-xs font-bold flex items-center gap-1 border-2 transition 
                              ${leg.legStatus === "verloren" ? "border-yellow-300 shadow-lg" : "border-transparent hover:border-red-300"}`}
                            style={{ cursor: "pointer", opacity: 1 }}
                            tabIndex={0}
                          ><XCircle size={14}/></button>
                          <button
                            type="button"
                            onClick={() => updateLegStatus(t.id, i, "offen")}
                            className={`px-1 py-0.5 rounded bg-blue-700 text-white text-xs font-bold flex items-center gap-1 border-2 transition 
                              ${leg.legStatus === "offen" ? "border-yellow-300 shadow-lg" : "border-transparent hover:border-blue-300"}`}
                            style={{ cursor: "pointer", opacity: 1 }}
                            tabIndex={0}
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
                  {/* kleine Info wenn Sammel-Update läuft */}
                  {legMassUpdate.id === t.id && legMassUpdate.status && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-200 text-[#111] font-bold ml-2">
                      Alle Legs auf {legMassUpdate.status}
                    </span>
                  )}
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
