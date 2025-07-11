"use client";
import React, { useState, useEffect } from "react";

type Leg = {
  market: string;
  pick: string;
  odds: number | string;
};

type Tip = {
  id: number;
  sport: "Football" | "Tennis";
  event: string;
  kickoff: string;
  combo: boolean;
  status: string;
  league: string;
  analysis: string;
  legs: Leg[];
};

const LEAGUE_OPTIONS = [
  { label: "Bundesliga", code: "soccer_germany_bundesliga" },
  { label: "2. Bundesliga", code: "soccer_germany_bundesliga2" },
  { label: "DFB Pokal", code: "soccer_germany_dfb_pokal" },
  { label: "Premier League", code: "soccer_epl" },
  { label: "FA Cup", code: "soccer_fa_cup" },
  { label: "Championship", code: "soccer_efl_champ" },
  { label: "La Liga", code: "soccer_spain_la_liga" },
  { label: "Copa del Rey", code: "soccer_spain_copa_del_rey" },
  { label: "Serie A", code: "soccer_italy_serie_a" },
  { label: "Coppa Italia", code: "soccer_italy_coppa_italia" },
  { label: "Ligue 1", code: "soccer_france_ligue_one" },
  { label: "Coupe de France", code: "soccer_france_coupe_de_france" },
  { label: "Eredivisie", code: "soccer_netherlands_eredivisie" },
  { label: "Portugal Primeira Liga", code: "soccer_portugal_primeira_liga" },
  { label: "Champions League", code: "soccer_uefa_champs_league" },
  { label: "Europa League", code: "soccer_uefa_europa_league" },
  { label: "Conference League", code: "soccer_uefa_conference_league" },
  { label: "Süper Lig (Türkei)", code: "soccer_turkey_super_league" },
  { label: "Super League (Schweiz)", code: "soccer_switzerland_superleague" },
  { label: "Jupiler Pro League (Belgien)", code: "soccer_belgium_first_div" },
  { label: "Super League (Griechenland)", code: "soccer_greece_super_league" },
  { label: "MLS (USA)", code: "soccer_usa_mls" },
  { label: "Brasilien Serie A", code: "soccer_brazil_campeonato" },
  { label: "Argentinien Primera Division", code: "soccer_argentina_primera_division" },
  { label: "Austria Bundesliga", code: "soccer_austria_bundesliga" },
  { label: "Dänemark Superligaen", code: "soccer_denmark_superliga" },
  { label: "Russland Premier Liga", code: "soccer_russia_premier_league" },
  { label: "Polen Ekstraklasa", code: "soccer_poland_ekstraklasa" },
  { label: "Schweden Allsvenskan", code: "soccer_sweden_allsvenskan" },
  { label: "Norwegen Eliteserien", code: "soccer_norway_eliteserien" },
  { label: "International Freundschaftsspiel", code: "soccer_international_friendly" },
  { label: "Frauen-WM", code: "soccer_fifa_womens_world_cup" },
  { label: "Männer-WM", code: "soccer_fifa_world_cup" },
  { label: "EM", code: "soccer_uefa_euro" },
  { label: "Afrika Cup", code: "soccer_africa_cup_of_nations" },
  { label: "Asien Cup", code: "soccer_afc_asian_cup" },
  { label: "Andere (Handeingabe)", code: "" },
];

const ODDS_API_KEY = "HIER_DEIN_API_KEY"; // <-- DEIN KEY HIER!

export default function AdminPage() {
  const [pwInput, setPwInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tip, setTip] = useState({
    sport: "Football",
    event: "",
    kickoff: "",
    combo: false,
    status: "offen",
    league: LEAGUE_OPTIONS[0].code,
    analysis: "",
    legs: [{ market: "", pick: "", odds: "" }],
  });
  const [customLeague, setCustomLeague] = useState("");
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin-logged-in") === "yes") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/tips")
        .then((res) => res.json())
        .then(setAllTips);
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
      if (value === "") setCustomLeague(""); // Nur bei "Andere" leer lassen
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTip = {
      ...tip,
      league: tip.league || customLeague,
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
    if (res.ok) {
      setMessage("Tipp gespeichert! Aktualisiere die Hauptseite.");
      setTip({
        sport: "Football",
        event: "",
        kickoff: "",
        combo: false,
        status: "offen",
        league: LEAGUE_OPTIONS[0].code,
        analysis: "",
        legs: [{ market: "", pick: "", odds: "" }],
      });
      setCustomLeague("");
      fetch("/api/tips")
        .then((res) => res.json())
        .then(setAllTips);
    } else {
      setMessage("Fehler beim Speichern!");
    }
  };

  // Quote aktualisieren für das erste Leg (dynamisch nach Liga-Auswahl)
  const updateOdds = async (tipId: number) => {
    setLoading(tipId);
    const tip = allTips.find(t => t.id === tipId);
    if (!tip) {
      setLoading(null);
      return alert("Tipp nicht gefunden!");
    }
    if (tip.sport !== "Football") {
      setLoading(null);
      return alert("Nur für Fußball-Tipps implementiert.");
    }
    let leagueKey = tip.league || customLeague;
    if (!leagueKey) {
      setLoading(null);
      return alert("Liga nicht erkannt!");
    }
    try {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${leagueKey}/odds/?regions=eu&markets=h2h&apiKey=${ODDS_API_KEY}`
      );
      const data = await res.json();
      const event = data.find((ev: any) =>
        tip.event.toLowerCase().includes(ev.home_team.toLowerCase()) ||
        tip.event.toLowerCase().includes(ev.away_team.toLowerCase())
      );
      if (!event || !event.bookmakers?.length) {
        setLoading(null);
        return alert("Event/Quoten nicht gefunden!");
      }
      const marketObj = event.bookmakers[0].markets[0];
      const homeOdds = marketObj.outcomes[0].price;
      const res2 = await fetch("/api/tips/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tipId, odds: homeOdds })
      });
      if (res2.ok) {
        setMessage("Quote wurde aktualisiert!");
        fetch("/api/tips").then(res => res.json()).then(setAllTips);
      } else {
        setMessage("Konnte Quote nicht aktualisieren.");
      }
    } catch (err) {
      setMessage("API-Fehler!");
    }
    setLoading(null);
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/tips/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAllTips((tips) => tips.filter((t) => t.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-logged-in");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={handleLogin} className="bg-neutral-900 p-6 rounded-xl shadow-xl flex flex-col gap-4 w-full max-w-xs">
          <input
            type="password"
            placeholder="Passwort"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
          />
          <button className="bg-[#00D2BE] hover:bg-[#00c2ae] text-black font-bold p-2 rounded" type="submit">
            Login
          </button>
          {loginError && <div className="mt-2 text-red-400 text-center">{loginError}</div>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Neuen Tipp eintragen</h1>
          <button onClick={handleLogout} className="text-sm text-neutral-400 hover:text-neutral-200">Logout</button>
        </div>
        <form onSubmit={handleSubmit} className="bg-neutral-900 p-6 rounded-xl shadow-xl flex flex-col gap-4">
          <select name="sport" value={tip.sport} onChange={handleChange} className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold">
            <option value="Football">Fußball</option>
            <option value="Tennis">Tennis</option>
          </select>
          <input name="event" placeholder="Event" value={tip.event} onChange={handleChange} required className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold" />
          <input name="kickoff" placeholder="Kickoff (z.B. 2025-08-10T15:30)" value={tip.kickoff} onChange={handleChange} required className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold" />
          {/* LIGA AUSWAHL */}
          <select
            name="league"
            value={tip.league}
            onChange={handleChange}
            className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
          >
            {LEAGUE_OPTIONS.map(l => (
              <option key={l.code || l.label} value={l.code}>{l.label}</option>
            ))}
          </select>
          {tip.league === "" && (
            <input
              name="customLeague"
              placeholder="Liga (Handeingabe, z.B. 'copa_libertadores')"
              value={customLeague}
              onChange={handleChange}
              className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
              required
            />
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
            Kombi-Tipp?
          </label>
          {/* Dynamische Legs */}
          {tip.combo ? (
            <>
              {tip.legs.map((leg, idx) => (
                <div key={idx} className="mb-2 border-b border-neutral-700 pb-2 flex gap-2 items-center">
                  <input
                    name={`market-${idx}`}
                    placeholder="Markt"
                    value={leg.market}
                    onChange={handleChange}
                    required
                    className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
                  />
                  <input
                    name={`pick-${idx}`}
                    placeholder="Tipp"
                    value={leg.pick}
                    onChange={handleChange}
                    required
                    className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
                  />
                  <input
                    name={`odds-${idx}`}
                    placeholder="Quote"
                    type="number"
                    step="0.01"
                    value={leg.odds}
                    onChange={handleChange}
                    required
                    className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold w-24"
                  />
                  {tip.legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newLegs = tip.legs.filter((_, i) => i !== idx);
                        setTip(prev => ({ ...prev, legs: newLegs }));
                      }}
                      className="ml-2 text-red-400 hover:text-red-600 font-bold"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mb-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-3 py-1 rounded font-semibold"
                onClick={() => setTip(prev => ({
                  ...prev,
                  legs: [...prev.legs, { market: "", pick: "", odds: "" }],
                }))}
              >
                + Weitere Wette
              </button>
            </>
          ) : (
            <>
              <input
                name="market-0"
                placeholder="Markt"
                value={tip.legs[0]?.market || ""}
                onChange={handleChange}
                required
                className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
              />
              <input
                name="pick-0"
                placeholder="Tipp"
                value={tip.legs[0]?.pick || ""}
                onChange={handleChange}
                required
                className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
              />
              <input
                name="odds-0"
                placeholder="Quote"
                type="number"
                step="0.01"
                value={tip.legs[0]?.odds || ""}
                onChange={handleChange}
                required
                className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
              />
            </>
          )}
          {/* ANALYSE */}
          <textarea
            name="analysis"
            placeholder="Kurzanalyse zum Tipp"
            value={tip.analysis}
            onChange={handleChange}
            rows={3}
            className="p-2 rounded bg-neutral-100 text-neutral-900 font-semibold"
          />
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
          <button className="bg-[#00D2BE] hover:bg-[#00c
