"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Trash2, PlusCircle, Save, ShieldCheck, Loader2, Eye, Zap } from "lucide-react";

// --- Ligen-Optionen ---
const LEAGUE_OPTIONS = [
  // Deutschland
  "Bundesliga", "2. Bundesliga", "3. Liga", "DFB-Pokal",
  // England
  "Premier League", "Championship (England)", "FA Cup",
  // Spanien
  "La Liga", "Segunda División (Spanien)", "Copa del Rey",
  // Italien
  "Serie A", "Serie B (Italien)", "Coppa Italia",
  // Frankreich
  "Ligue 1", "Ligue 2 (Frankreich)", "Coupe de France",
  // Türkei/NL/BeNeLux
  "Süper Lig", "Eredivisie (Niederlande)", "Jupiler Pro League (Belgien)",
  "Super League (Schweiz)", "Austrian Bundesliga",
  // International
  "Primeira Liga (Portugal)", "Champions League", "Europa League", "Conference League",
  "WM", "EM", "Afrika Cup", "Copa America", "MLS (USA)", "Brasileirao",
  // Extra
  "Andere internationale Liga", "Freundschaftsspiel", "Eigene Liga eintragen..."
];

type Leg = { market: string; pick: string; odds: string | number };

// --- Admin Page ---
export default function AdminPage() {
  const [pwInput, setPwInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tip, setTip] = useState({
    sport: "Football",
    league: LEAGUE_OPTIONS[0],
    event: "",
    kickoff: "",
    combo: false,
    status: "offen",
    analysis: "",
    legs: [{ market: "", pick: "", odds: "" }],
  });
  const [customLeague, setCustomLeague] = useState("");
  const [allTips, setAllTips] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Kumulierte Quote für Kombi berechnen
  const comboOdds = tip.legs.reduce((acc, cur) => {
    const v = parseFloat(cur.odds as string);
    return acc * (v > 0 ? v : 1);
  }, 1);

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

  // Passwort-Login (nur Demo! Production: immer Backend-Schutz nutzen!)
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

  // Tipp-Feld ändern
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.startsWith("market-") || name.startsWith("pick-") || name.startsWith("odds-")) {
      const idx = Number(name.split("-")[1]);
      const key = name.split("-")[0] as "market" | "pick" | "odds";
      const newLegs = [...tip.legs];
      newLegs[idx][key] = value;
      setTip((prev) => ({ ...prev, legs: newLegs }));
    } else if (name === "combo") {
      setTip((prev) => ({
        ...prev,
        combo: (e.target as HTMLInputElement).checked,
        legs: (e.target as HTMLInputElement).checked
          ? prev.legs.length > 1
            ? prev.legs
            : [{ market: "", pick: "", odds: "" }, { market: "", pick: "", odds: "" }]
          : [prev.legs[0]],
      }));
    } else if (name === "league") {
      setTip((prev) => ({
        ...prev,
        league: value,
      }));
      if (value === "Eigene Liga eintragen...") setCustomLeague("");
    } else if (name === "customLeague") {
      setCustomLeague(value);
    } else {
      setTip((prev) => ({
        ...prev,
        [name]: type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
      }));
    }
  };

  // Quote automatisch per API holen
  const fetchOdds = async (idx: number) => {
    const league = tip.league === "Eigene Liga eintragen..." ? customLeague : tip.league;
    const event = tip.event;
    const market = tip.legs[idx].market;
    // Du kannst das Mapping nach Bedarf anpassen!
    let leagueApiName = "";
    switch (league) {
      case "Bundesliga": leagueApiName = "soccer_germany_bundesliga"; break;
      case "Premier League": leagueApiName = "soccer_epl"; break;
      case "Champions League": leagueApiName = "soccer_uefa_champs_league"; break;
      case "La Liga": leagueApiName = "soccer_spain_la_liga"; break;
      case "Serie A": leagueApiName = "soccer_italy_serie_a"; break;
      // ... Restliche Zuordnungen!
      default: leagueApiName = ""; break;
    }
    if (!leagueApiName) return alert("Für diese Liga ist kein API-Mapping hinterlegt.");
    try {
      const res = await fetch(`/api/odds/${leagueApiName}?event=${encodeURIComponent(event)}&market=${encodeURIComponent(market)}`);
      const data = await res.json();
      // Hier musst du je nach API das passende rausholen!
      // Dummy: erste Outcome-Quote
      const newOdds = data?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price;
      if (newOdds) {
        setTip((prev) => {
          const newLegs = [...prev.legs];
          newLegs[idx].odds = newOdds;
          return { ...prev, legs: newLegs };
        });
      } else {
        alert("Konnte keine Quote laden.");
      }
    } catch (e) {
      alert("Fehler beim Laden der Quote.");
    }
  };

  // Tipp speichern
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newTip = {
      ...tip,
      league: tip.league === "Eigene Liga eintragen..." ? customLeague : tip.league,
      legs: tip.legs.map(leg => ({
        ...leg,
        odds: parseFloat(String(leg.odds)),
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
        league: LEAGUE_OPTIONS[0],
        event: "",
        kickoff: "",
        combo: false,
        status: "offen",
        analysis: "",
        legs: [{ market: "", pick: "", odds: "" }],
      });
      setCustomLeague("");
      fetch("/api/tips").then((res) => res.json()).then(setAllTips);
    } else {
      setMessage("❌ Fehler beim Speichern!");
    }
  };

  // Tipp löschen
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

  // ---- LOGIN UI ----
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-[#001b1c] px-4">
        <div className="max-w-xs w-full glass p-8 rounded-3xl shadow-2xl relative border border-[#00d2be44]">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <ShieldCheck size={44} className="text-[#00D2BE] drop-shadow-xl animate-bounce" />
          </div>
          <h1 className="font-black text-2xl text-center text-[#00D2BE] tracking-widest mt-8 animate-glitch">
            PROJEKT PARLAYS ADMIN PANEL
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
            background: rgba(24,32,34,0.90);
            backdrop-filter: blur(7px) saturate(120%);
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

  // ---- MAIN PANEL ----
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#181e1e] to-[#00d2be11] p-8">
      <div className="max-w-2xl mx-auto glass border border-[#00d2be33] shadow-2xl rounded-3xl p-7 mt-8">
        <header className="flex items-center gap-4 mb-8">
          <h1 className="font-black text-3xl text-[#00D2BE] tracking-wide flex-1">
            PROJEKT PARLAYS ADMIN PANEL
          </h1>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full bg-[#181e1e] hover:bg-[#262e2e] border border-[#00D2BE44] shadow-md">
            <LogOut className="text-[#00D2BE]" size={24} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select name="sport" value={tip.sport} onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow">
              <option value="Football">Fußball</option>
              <option value="Tennis">Tennis</option>
            </select>
            <select name="league" value={tip.league} onChange={handleChange}
              className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow">
              {LEAGUE_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          {tip.league === "Eigene Liga eintragen..." && (
            <input
              type="text"
              name="customLeague"
              value={customLeague}
              onChange={handleChange}
              placeholder="Liga eingeben"
              className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold"
            />
          )}
          <input name="event" placeholder="Event (z.B. Team A vs. Team B)" value={tip.event} onChange={handleChange} required
            className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold" />
          <input name="kickoff" placeholder="Kickoff (2025-08-10T15:30)" value={tip.kickoff} onChange={handleChange} required
            className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold" />
          <textarea
            name="analysis"
            value={tip.analysis}
            onChange={handleChange}
            placeholder="Kurze Analyse / Begründung (max. 240 Zeichen)"
            maxLength={240}
            className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
            <span className="text-neutral-200 font-bold">Kombi-Tipp?</span>
          </label>
          {/* Legs und Quoten */}
          {tip.legs.map((leg, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 items-center bg-[#161c1c] rounded-xl p-2 mb-2">
              <input
                name={`market-${idx}`}
                placeholder="Markt"
                value={leg.market}
                onChange={handleChange}
                required
                className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
              />
              <input
                name={`pick-${idx}`}
                placeholder="Tipp"
                value={leg.pick}
                onChange={handleChange}
                required
                className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
              />
              <input
                name={`odds-${idx}`}
                placeholder="Quote"
                type="number"
                step="0.01"
                value={leg.odds}
                onChange={handleChange}
                required
                className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
              />
              <button
                type="button"
                title="Quote automatisch laden"
                onClick={() => fetchOdds(idx)}
                className="flex items-center gap-1 bg-[#00D2BE] hover:bg-[#0098aa] text-black font-bold px-3 py-2 rounded-lg shadow text-xs transition"
              >
                <Zap size={16} /> Quote holen
              </button>
              {tip.combo && tip.legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTip(prev => ({
                    ...prev,
                    legs: prev.legs.filter((_, i) => i !== idx),
                  }))}
                  className="ml-1 px-2 py-1 rounded text-xs bg-red-500 text-white font-bold"
                >Entfernen</button>
              )}
            </div>
          ))}
          {tip.combo && (
            <button
              type="button"
              onClick={() => setTip(prev => ({
                ...prev,
                legs: [...prev.legs, { market: "", pick: "", odds: "" }],
              }))}
              className="flex items-center gap-2 mt-2 px-3 py-2 bg-[#00D2BE] hover:bg-[#05b9a7] rounded-lg text-black font-bold shadow"
            >
              <PlusCircle size={16} /> Weitere Wette hinzufügen
            </button>
          )}
          {tip.combo && (
            <div className="mt-2 text-[#00D2BE] font-bold text-right text-base">
              Kumulierte Kombi-Quote: <span className="ml-2">{comboOdds.toFixed(2)}</span>
            </div>
          )}
          <select
            name="status"
            value={tip.status}
            onChange={handleChange}
            className="p-2 rounded bg-[#181e1e] border border-[#00D2BE55] text-[#00D2BE] font-bold"
          >
            <option value="offen">Offen</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="gewonnen">Gewonnen</option>
            <option value="verloren">Verloren</option>
          </select>
          <button className="flex items-center gap-2 bg-[#00D2BE] hover:bg-[#00c2ae] text-black font-bold px-5 py-2 rounded-xl shadow mt-2" type="submit" disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Tipp speichern
          </button>
          {message && <div className="mt-2 text-center text-[#00D2BE]">{message}</div>}
        </form>
        {/* Tipp-Liste */}
        <h2 className="text-xl font-bold mt-10 mb-2 text-neutral-100">Bereits eingetragene Tipps</h2>
        <ul className="space-y-2 w-full">
          {allTips.map((t) => (
            <li key={t.id} className="flex justify-between items-center bg-neutral-800 rounded p-2">
              <div>
                <strong>{t.event}</strong> <span className="text-xs">({t.league})</span><br />
                {t.sport === "Football" ? "Fußball" : t.sport}{" "}
                {t.combo && (
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-600 text-white rounded">Kombi</span>
                )}
                <br />
                {t.legs.map((leg: Leg, idx: number) => (
                  <span key={idx} className="block text-xs">
                    {leg.market}: <b>{leg.pick}</b> @ {leg.odds}
                  </span>
                ))}
                <span className="ml-2 px-2 py-1 rounded text-xs" style={{
                  backgroundColor:
                    t.status === "gewonnen" ? "#16a34a" :
                      t.status === "verloren" ? "#ef4444" :
                        t.status === "abgeschlossen" ? "#d4d4d8" : "#2563eb",
                  color: t.status === "abgeschlossen" ? "#111" : "#fff"
                }}>{t.status}</span>
                {t.analysis && (
                  <div className="mt-1 text-xs text-neutral-300"><b>Analyse:</b> {t.analysis}</div>
                )}
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deleting === t.id}
                className="text-red-400 hover:text-red-600 font-bold ml-4 flex items-center"
              >
                <Trash2 size={16} />
                {deleting === t.id ? "..." : "Löschen"}
              </button>
            </li>
          ))}
          {allTips.length === 0 && <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>}
        </ul>
      </div>
    </main>
  );
}
