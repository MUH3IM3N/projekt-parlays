"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Trash2, PlusCircle, Save, ShieldCheck, Eye } from "lucide-react";

const LEAGUES = [
  "Bundesliga", "2. Bundesliga", "3. Liga", "DFB-Pokal",
  "Premier League", "Championship (England)", "FA Cup",
  "La Liga", "Segunda División (Spanien)", "Copa del Rey",
  "Serie A", "Serie B (Italien)", "Coppa Italia",
  "Ligue 1", "Ligue 2 (Frankreich)", "Coupe de France",
  "Süper Lig", "Eredivisie (Niederlande)", "Jupiler Pro League (Belgien)",
  "Super League (Schweiz)", "Austrian Bundesliga", "Primeira Liga (Portugal)",
  "Champions League", "Europa League", "Conference League",
  "WM", "EM", "Afrika Cup", "Copa America", "MLS (USA)", "Brasileirao",
  "Andere internationale Liga", "Freundschaftsspiel", "Eigene Liga eintragen..."
];

type Leg = {
  league: string;
  customLeague?: string;
  event: string;
  market: string;
  pick: string;
  odds: string;
  analysis: string;
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
      },
    ] as Leg[],
  });
  const [allTips, setAllTips] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Passwort-Login
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    idx?: number
  ) => {
    const { name, value, type } = e.target;
    if (typeof idx === "number") {
      setTip((prev) => {
        const newLegs = [...prev.legs];
        if (name === "league") {
          newLegs[idx].league = value;
          if (value !== "Eigene Liga eintragen...") newLegs[idx].customLeague = "";
        } else if (name === "customLeague") {
          newLegs[idx].customLeague = value;
        } else {
          newLegs[idx][name as keyof Leg] = value;
        }
        return { ...prev, legs: newLegs };
      });
    } else if (name === "combo") {
      setTip((prev) => ({
        ...prev,
        combo: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setTip((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  // Leg hinzufügen/entfernen – immer möglich!
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
        },
      ],
    }));
  };
  const removeLeg = (idx: number) => {
    setTip((prev) => ({
      ...prev,
      legs: prev.legs.length > 1 ? prev.legs.filter((_, i) => i !== idx) : prev.legs,
    }));
  };

  // Tipp speichern
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newTip = {
      ...tip,
      legs: tip.legs.map((leg) => ({
        ...leg,
        league: leg.league === "Eigene Liga eintragen..." ? leg.customLeague : leg.league,
        odds: parseFloat(leg.odds),
      })),
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
          },
        ],
      });
      fetch("/api/tips").then((res) => res.json()).then(setAllTips);
    } else {
      setMessage("❌ Fehler beim Speichern!");
    }
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

  // --- Layout ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-[#001b1c] px-4">
        {/* ... Login-Form bleibt gleich ... */}
        <div className="max-w-xs w-full glass p-8 rounded-3xl shadow-2xl relative border border-[#00d2be44]">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <ShieldCheck size={44} className="text-[#00D2BE] drop-shadow-xl animate-bounce" />
          </div>
          <h1 className="font-black text-2xl text-center text-[#00D2BE] tracking-widest mt-8 animate-glitch">
            Projekt Parlays Admin Panel
          </h1>
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
            background: rgba(24,32,34,0.92);
            backdrop-filter: blur(8px) saturate(130%);
          }
          .animate-glitch {
            text-shadow: 0 0 8px #00D2BE, 0 0 1px #000, 0 1px 2px #00D2BE, 0 0 12px #00D2BE44;
            letter-spacing: 0.18em;
            animation: glitch-flicker 2s infinite alternate;
          }
          @keyframes glitch-flicker {
            0%   { filter: brightness(1); }
            8%   { filter: brightness(1.12); text-shadow: 0 0 20px #00d2be, 0 2px 8px #007c6a55; }
            10%  { filter: brightness(1.2) contrast(1.1); }
            12%  { filter: brightness(1.2); }
            14%  { filter: brightness(1.1); }
            17%  { filter: brightness(1.0); }
            23%  { filter: brightness(1.06); }
            25%  { filter: brightness(1.14); }
            60%  { filter: brightness(1.0); }
            100% { filter: brightness(1.0); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#181e1e] to-[#00d2be11] p-8">
      <div className="max-w-3xl mx-auto glass border border-[#00d2be33] shadow-2xl rounded-3xl p-7 mt-8">
        <header className="flex items-center gap-4 mb-8">
          <h1 className="font-black text-3xl text-[#00D2BE] tracking-wide flex-1">
            Projekt Parlays Admin Panel
          </h1>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full bg-[#181e1e] hover:bg-[#262e2e] border border-[#00D2BE44] shadow-md">
            <LogOut className="text-[#00D2BE]" size={24} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="flex flex-col md:flex-row gap-5">
            <select
              name="sport"
              value={tip.sport}
              onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow flex-1"
            >
              <option value="Football">Fußball</option>
              <option value="Tennis">Tennis</option>
            </select>
            <label className="flex items-center gap-2 ml-2 cursor-pointer text-neutral-200 font-bold">
              <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
              Kombi-Tipp?
            </label>
            <select
              name="status"
              value={tip.status}
              onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow flex-1"
            >
              <option value="offen">Offen</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="gewonnen">Gewonnen</option>
              <option value="verloren">Verloren</option>
            </select>
          </div>
          {/* Alle Legs/Wetten */}
          <div className="flex flex-col gap-6">
            {tip.legs.map((leg, idx) => (
              <div key={idx} className="bg-[#161c1c] border border-[#00D2BE22] rounded-2xl p-5 shadow space-y-3 relative">
                {tip.legs.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-400 hover:text-red-700"
                    onClick={() => removeLeg(idx)}
                    title="Entfernen"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <select
                      name="league"
                      value={leg.league}
                      onChange={(e) => handleChange(e, idx)}
                      className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold w-full mb-1"
                    >
                      {LEAGUES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {leg.league === "Eigene Liga eintragen..." && (
                      <input
                        type="text"
                        name="customLeague"
                        value={leg.customLeague}
                        onChange={(e) => handleChange(e, idx)}
                        placeholder="Liga eingeben"
                        className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold w-full"
                      />
                    )}
                  </div>
                  <input
                    name="event"
                    placeholder="Event (z.B. Team A vs. Team B)"
                    value={leg.event}
                    onChange={(e) => handleChange(e, idx)}
                    required
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold flex-1"
                  />
                  <input
                    name="market"
                    placeholder="Markt"
                    value={leg.market}
                    onChange={(e) => handleChange(e, idx)}
                    required
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold flex-1"
                  />
                  <input
                    name="pick"
                    placeholder="Tipp"
                    value={leg.pick}
                    onChange={(e) => handleChange(e, idx)}
                    required
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold flex-1"
                  />
                  <input
                    name="odds"
                    placeholder="Quote"
                    type="number"
                    step="0.01"
                    value={leg.odds}
                    onChange={(e) => handleChange(e, idx)}
                    required
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold flex-1"
                  />
                </div>
                <textarea
                  name="analysis"
                  placeholder="Kurzanalyse zu diesem Spiel (max. 240 Zeichen)"
                  value={leg.analysis}
                  maxLength={240}
                  onChange={(e) => handleChange(e, idx)}
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold w-full"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLeg}
            className="flex gap-2 items-center bg-[#00D2BE] hover:bg-[#00a3a3] text-black font-bold px-4 py-2 rounded-lg mt-2 shadow"
          >
            <PlusCircle /> Weitere Wette hinzufügen
          </button>
          <input
            name="kickoff"
            placeholder="Kickoff (z.B. 2025-08-10T15:30)"
            value={tip.kickoff}
            onChange={handleChange}
            required
            className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold"
          />
          <button
            className="flex items-center gap-2 bg-[#00D2BE] hover:bg-[#00a3a3] text-black font-black rounded-full px-6 py-3 text-lg shadow-xl mt-2"
            type="submit"
            disabled={saving}
          >
            <Save /> {saving ? "Speichere..." : "Tipp speichern"}
          </button>
          {message && <div className="text-center mt-2 text-[#00D2BE] font-bold">{message}</div>}
        </form>
        <h2 className="text-xl font-bold mt-12 mb-4">Bereits eingetragene Tipps</h2>
        <ul className="space-y-2 w-full">
          {allTips.map((t) => (
            <li key={t.id} className="flex justify-between items-start bg-neutral-800 rounded p-3">
              <div>
                <div className="font-bold">{t.combo ? "Kombi" : "Einzel"} • {t.sport === "Football" ? "Fußball" : t.sport} • {t.status}</div>
                {t.legs.map((leg: Leg, idx: number) => (
                  <div key={idx} className="pl-2 text-sm mb-2">
                    <b>{leg.league}</b> – <b>{leg.event}</b> <br />
                    {leg.market}: <b>{leg.pick}</b> @ {leg.odds} <br />
                    <i className="text-xs text-neutral-400">{leg.analysis}</i>
                  </div>
                ))}
                <div className="text-xs text-neutral-500">Kickoff: {t.kickoff}</div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-400 hover:text-red-600 font-bold ml-4"
                disabled={deleting === t.id}
              >
                <Trash2 /> {deleting === t.id ? "..." : "Löschen"}
              </button>
            </li>
          ))}
          {allTips.length === 0 && <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>}
        </ul>
      </div>
    </main>
  );
}
