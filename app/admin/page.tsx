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
  legs: Leg[];
};

const ODDS_API_KEY = "2c48af12f89b67bf716be7fc1c79d6f9"; // <-- DEIN KEY HIER!

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
    legs: [{ market: "", pick: "", odds: "" }],
  });
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<number | null>(null);

  // Passwort-Login prüfen (localStorage)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Einfacher Dummy-Login: Passwort „parlays123“
    if (pwInput === "parlays123") {
      setIsLoggedIn(true);
      setLoginError("");
      localStorage.setItem("admin-logged-in", "yes");
    } else {
      setLoginError("Falsches Passwort!");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
        legs: [{ market: "", pick: "", odds: "" }],
      });
      fetch("/api/tips")
        .then((res) => res.json())
        .then(setAllTips);
    } else {
      setMessage("Fehler beim Speichern!");
    }
  };

  // --- Quote aktualisieren (nur für das erste Leg, nur Fußball) ---
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
    try {
      // Beispiel: Premier League (soccer_epl), andere Ligen ggf. anpassen!
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?regions=eu&markets=h2h&apiKey=${ODDS_API_KEY}`
      );
      const data = await res.json();
      // Such-Logik: eventName soll enthalten sein
      const event = data.find((ev: any) =>
        tip.event.toLowerCase().includes(ev.home_team.toLowerCase())
        || tip.event.toLowerCase().includes(ev.away_team.toLowerCase())
      );
      if (!event || !event.bookmakers?.length) {
        setLoading(null);
        return alert("Event/Quoten nicht gefunden!");
      }
      // Nur erstes Leg aktualisieren (bei Bedarf ausbauen)
      const marketObj = event.bookmakers[0].markets[0];
      const homeOdds = marketObj.outcomes[0].price;

      // Update via API
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
          <label className="flex items-center gap-2">
            <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
            Kombi-Tipp?
          </label>
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
          <button className="bg-[#00D2BE] hover:bg-[#00c2ae] text-black font-bold p-2 rounded" type="submit">
            Tipp speichern
          </button>
          {message && <div className="mt-2 text-center">{message}</div>}
        </form>
        {/* Tipp-Liste */}
        <h2 className="text-xl font-bold mt-10 mb-2">Bereits eingetragene Tipps</h2>
        <ul className="space-y-2 w-full">
          {allTips.map((t) => (
            <li key={t.id} className="flex justify-between items-center bg-neutral-800 rounded p-2">
              <div>
                <strong>{t.event}</strong> ({t.kickoff})<br />
                {t.sport === "Football" ? "Fußball" : t.sport}{" "}
                {t.combo ? (
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-600 text-white rounded">Kombi</span>
                ) : null}
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
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-400 hover:text-red-600 font-bold ml-2"
                >
                  Löschen
                </button>
                <button
                  onClick={() => updateOdds(t.id)}
                  className="text-[#00D2BE] hover:text-[#008e7d] font-bold ml-2"
                  disabled={loading === t.id}
                >
                  {loading === t.id ? "..." : "Quote aktualisieren"}
                </button>
              </div>
            </li>
          ))}
          {allTips.length === 0 && <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>}
        </ul>
      </div>
    </main>
  );
}
