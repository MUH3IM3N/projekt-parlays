"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Trash2, PlusCircle, Save, ShieldCheck, Loader2, Eye, Zap } from "lucide-react";

// -------- ALLE Ligen --------
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
  "Süper Lig", "Eredivisie (Niederlande)", "Jupiler Pro League (Belgien)", "Super League (Schweiz)", "Austrian Bundesliga",
  // International
  "Primeira Liga (Portugal)", "Champions League", "Europa League", "Conference League", "WM", "EM", "Afrika Cup", "Copa America", "MLS (USA)", "Brasileirao",
  // Extra
  "Andere internationale Liga", "Freundschaftsspiel", "Eigene Liga eintragen...",
];

// --------- Typen --------
type Leg = {
  league: string;
  customLeague?: string;
  event: string;
  kickoff: string;
  market: string;
  pick: string;
  odds: string | number;
};

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
    legs: [{
      league: LEAGUE_OPTIONS[0],
      customLeague: "",
      event: "",
      kickoff: "",
      market: "",
      pick: "",
      odds: "",
    }],
  });
  const [customLeague, setCustomLeague] = useState("");
  const [allTips, setAllTips] = useState<any[]>([]);
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

  // Passwort-Login
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
    if (name.startsWith("leg-")) {
      // für Kombi: pro Leg-Feld
      const [_, idxStr, key] = name.split("-");
      const idx = Number(idxStr);
      const newLegs = [...tip.legs];
      if (key === "league") {
        newLegs[idx].league = value;
        if (value !== "Eigene Liga eintragen...") newLegs[idx].customLeague = "";
      } else if (key === "customLeague") {
        newLegs[idx].customLeague = value;
      } else {
        (newLegs[idx] as any)[key] = value;
      }
      setTip((prev) => ({ ...prev, legs: newLegs }));
    } else if (name === "combo") {
      setTip((prev) => ({
        ...prev,
        combo: (e.target as HTMLInputElement).checked,
        legs: (e.target as HTMLInputElement).checked
          ? prev.legs.length > 1
            ? prev.legs
            : [
              {
                league: LEAGUE_OPTIONS[0],
                customLeague: "",
                event: "",
                kickoff: "",
                market: "",
                pick: "",
                odds: "",
              },
              {
                league: LEAGUE_OPTIONS[0],
                customLeague: "",
                event: "",
                kickoff: "",
                market: "",
                pick: "",
                odds: "",
              },
            ]
          : [prev.legs[0]],
      }));
    } else if (name === "league") {
      setTip((prev) => ({
        ...prev,
        league: value,
      }));
      if (value !== "Eigene Liga eintragen...") setCustomLeague("");
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

  // Gesamtquote (Kombi)
  const totalOdds = tip.combo
    ? tip.legs.reduce(
        (sum, leg) => {
          const odd = Number(leg.odds);
          return odd > 0 ? sum * odd : sum;
        },
        1
      )
    : Number(tip.legs[0]?.odds) || 0;

  // Tipp speichern
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newTip = tip.combo
      ? {
          ...tip,
          legs: tip.legs.map((leg) => ({
            ...leg,
            league: leg.league === "Eigene Liga eintragen..." ? leg.customLeague : leg.league,
            odds: parseFloat(String(leg.odds)),
          })),
          id: Date.now(),
        }
      : {
          ...tip,
          league: tip.league === "Eigene Liga eintragen..." ? customLeague : tip.league,
          legs: [
            {
              league: tip.league === "Eigene Liga eintragen..." ? customLeague : tip.league,
              event: tip.event,
              kickoff: tip.kickoff,
              market: tip.legs[0].market,
              pick: tip.legs[0].pick,
              odds: parseFloat(String(tip.legs[0].odds)),
            },
          ],
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
        legs: [{
          league: LEAGUE_OPTIONS[0],
          customLeague: "",
          event: "",
          kickoff: "",
          market: "",
          pick: "",
          odds: "",
        }],
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

  // ----------- LOGIN UI -----------
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

  // ----------- MAIN PANEL -----------
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#181e1e] to-[#00d2be11] p-8">
      <div className="max-w-3xl mx-auto glass border border-[#00d2be33] shadow-2xl rounded-3xl p-7 mt-8">
        <header className="flex items-center gap-4 mb-8">
          <h1 className="font-black text-3xl text-[#00D2BE] tracking-wide flex-1">Projekt Parlays Admin Panel</h1>
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
            {!tip.combo ? (
              <select name="league" value={tip.league} onChange={handleChange}
                className="rounded-lg bg-[#181e1e] border border-[#00D2BE55] p-3 text-[#00D2BE] font-bold shadow">
                {LEAGUE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : null}
          </div>
          {!tip.combo && tip.league === "Eigene Liga eintragen..." && (
            <input
              type="text"
              name="customLeague"
              value={customLeague}
              onChange={handleChange}
              placeholder="Liga eingeben"
              className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold"
            />
          )}
          {!tip.combo && (
            <>
              <input name="event" placeholder="Event (z.B. Team A vs. Team B)" value={tip.event} onChange={handleChange} required
                className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold" />
              <input name="kickoff" placeholder="Kickoff (2025-08-10T15:30)" value={tip.kickoff} onChange={handleChange} required
                className="rounded bg-[#181e1e] border border-[#00D2BE55] p-3 w-full text-[#00D2BE] font-semibold" />
            </>
          )}
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
          {/* Kombi/Legs mit Odds API-Button */}
          {tip.combo &&
            tip.legs.map((leg, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 items-center bg-[#161c1c] rounded-xl p-2 mb-2">
                <select
                  name={`leg-${idx}-league`}
                  value={leg.league}
                  onChange={handleChange}
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                >
                  {LEAGUE_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {leg.league === "Eigene Liga eintragen..." && (
                  <input
                    name={`leg-${idx}-customLeague`}
                    value={leg.customLeague || ""}
                    onChange={handleChange}
                    placeholder="Liga eingeben"
                    className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                  />
                )}
                <input
                  name={`leg-${idx}-event`}
                  placeholder="Event"
                  value={leg.event}
                  onChange={handleChange}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name={`leg-${idx}-kickoff`}
                  placeholder="Kickoff (z.B. 2025-08-10T15:30)"
                  value={leg.kickoff}
                  onChange={handleChange}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name={`leg-${idx}-market`}
                  placeholder="Markt"
                  value={leg.market}
                  onChange={handleChange}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name={`leg-${idx}-pick`}
                  placeholder="Tipp"
                  value={leg.pick}
                  onChange={handleChange}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                <input
                  name={`leg-${idx}-odds`}
                  placeholder="Quote"
                  type="number"
                  step="0.01"
                  value={leg.odds}
                  onChange={handleChange}
                  required
                  className="rounded bg-[#232d2d] border border-[#00D2BE33] p-2 text-[#00D2BE] font-semibold"
                />
                {tip.legs.length > 1 && (
                  <button
                    type="button"
                    title="Leg entfernen"
                    onClick={() => {
                      const newLegs = tip.legs.filter((_, i) => i !== idx);
                      setTip(prev => ({ ...prev, legs: newLegs }));
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 font-bold"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))
          }
          {tip.combo && (
            <button
              type="button"
              onClick={() =>
                setTip((prev) => ({
                  ...prev,
                  legs: [
                    ...prev.legs,
                    {
                      league: LEAGUE_OPTIONS[0],
                      customLeague: "",
                      event: "",
                      kickoff: "",
                      market: "",
                      pick: "",
                      odds: "",
                    },
                  ],
                }))
              }
              className="flex items-center gap-2 text-[#00D2BE] font-bold py-1 px-3 mt-1 rounded hover:bg-[#222c2c] border border-[#00D2BE55]"
            >
              <PlusCircle size={18} /> Leg hinzufügen
            </button>
          )}
          {/* Anzeige: Kombi-Gesamtquote */}
          {tip.combo && tip.legs.length > 1 && (
            <div className="font-bold text-lg text-[#00D2BE] mb-2">
              Kumulierte Gesamtquote: {totalOdds.toFixed(2)}
            </div>
          )}
          <select
            name="status"
            value={tip.status}
            onChange={handleChange}
            className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
          >
            <option value="offen">Offen</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="gewonnen">Gewonnen</option>
            <option value="verloren">Verloren</option>
          </select>
          <button className="bg-[#00D2BE] hover:bg-[#00c2ae] text-black font-bold p-2 rounded w-full flex items-center justify-center gap-2" type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Tipp speichern
          </button>
          {message && <div className="mt-2 text-center">{message}</div>}
        </form>
        {/* Tipp-Liste */}
        <h2 className="text-xl font-bold mt-10 mb-2">Bereits eingetragene Tipps</h2>
        <ul className="space-y-2 w-full">
          {allTips.map((t) => (
            <li key={t.id} className="flex justify-between items-center bg-neutral-800 rounded p-2">
              <div>
                <strong>{t.combo ? "Kombi" : "Einzel"} • {t.legs.length > 1 ? `${t.legs.length} Legs` : null}</strong>
                <br />
                {t.combo
                  ? t.legs.map((leg: Leg, idx: number) => (
                      <div key={idx} className="pl-2 text-xs">
                        <b>{leg.league === "Eigene Liga eintragen..." ? leg.customLeague : leg.league}</b>: {leg.event} ({leg.kickoff})<br />
                        {leg.market}: <b>{leg.pick}</b> @ {leg.odds}
                      </div>
                    ))
                  : (
                    <span className="block text-xs">
                      <b>{t.league === "Eigene Liga eintragen..." ? t.customLeague : t.league}</b>: {t.event} ({t.kickoff})<br />
                      {t.legs[0].market}: <b>{t.legs[0].pick}</b> @ {t.legs[0].odds}
                    </span>
                  )
                }
                {t.analysis && <div className="text-[#00D2BE] text-xs mt-1">Analyse: {t.analysis}</div>}
                <span className="ml-2 px-2 py-1 rounded text-xs" style={{
                  backgroundColor:
                    t.status === "gewonnen" ? "#16a34a" :
                    t.status === "verloren" ? "#ef4444" :
                    t.status === "abgeschlossen" ? "#d4d4d8" : "#2563eb",
                  color: t.status === "abgeschlossen" ? "#111" : "#fff"
                }}>{t.status}</span>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-400 hover:text-red-600 font-bold ml-4"
                disabled={deleting === t.id}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
          {allTips.length === 0 && <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>}
        </ul>
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
