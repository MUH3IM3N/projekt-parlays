"use client";
import React, { useState, useEffect } from "react";

export default function AdminPage() {
  // Passwortschutz
  const [pwInput, setPwInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    // Automatisch einloggen, falls im localStorage gespeichert
    if (typeof window !== "undefined" && localStorage.getItem("admin-logged-in") === "yes") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pw: pwInput }),
    });
    const { ok } = await res.json();
    if (ok) {
      setIsLoggedIn(true);
      setLoginError("");
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-logged-in", "yes");
      }
    } else {
      setLoginError("Falsches Passwort!");
    }
  };

  // Tipp-Formular & Tipp-Liste wie vorher
  const [tip, setTip] = useState({
    sport: "Football",
    event: "",
    market: "",
    pick: "",
    odds: "",
    kickoff: "",
    combo: false,
    status: "offen",
  });
  const [allTips, setAllTips] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/tips")
      .then((res) => res.json())
      .then(setAllTips);
  }, [isLoggedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setTip((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTip = { ...tip, odds: parseFloat(String(tip.odds)), id: Date.now() };
    const res = await fetch("/api/tips/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTip),
    });
    if (res.ok) {
      setMessage("Tipp gespeichert! Aktualisiere die Hauptseite.");
      setTip({ sport: "Football", event: "", market: "", pick: "", odds: "", kickoff: "", combo: false, status: "offen" });
      fetch("/api/tips")
        .then((res) => res.json())
        .then(setAllTips);
    } else {
      setMessage("Fehler beim Speichern!");
    }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/tips/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAllTips((tips) => tips.filter((t) => t.id !== id));
  };

  // --- Passwortabfrage anzeigen ---
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
            className="p-2 rounded"
          />
          <button className="bg-[#00D2BE] hover:bg-[#00c2ae] text-black font-bold p-2 rounded" type="submit">
            Login
          </button>
          {loginError && <div className="mt-2 text-red-400 text-center">{loginError}</div>}
        </form>
      </main>
    );
  }

  // --- Admin-Bereich ---
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-bold mb-4">Neuen Tipp eintragen</h1>
      <form onSubmit={handleSubmit} className="bg-neutral-900 p-6 rounded-xl shadow-xl flex flex-col gap-4 w-full max-w-md">
        <select name="sport" value={tip.sport} onChange={handleChange} className="p-2 rounded">
          <option value="Football">Fußball</option>
          <option value="Tennis">Tennis</option>
        </select>
        <input name="event" placeholder="Event" value={tip.event} onChange={handleChange} required className="p-2 rounded" />
        <input name="market" placeholder="Markt" value={tip.market} onChange={handleChange} required className="p-2 rounded" />
        <input name="pick" placeholder="Tipp" value={tip.pick} onChange={handleChange} required className="p-2 rounded" />
        <input name="odds" placeholder="Quote" type="number" step="0.01" value={tip.odds} onChange={handleChange} required className="p-2 rounded" />
        <input name="kickoff" placeholder="Kickoff (z.B. 2025-08-10T15:30)" value={tip.kickoff} onChange={handleChange} required className="p-2 rounded" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="combo" checked={tip.combo} onChange={handleChange} />
          Kombi-Tipp?
        </label>
        <select name="status" value={tip.status} onChange={handleChange} className="p-2 rounded">
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

      {/* Tipp-Liste mit Lösch-Button */}
      <h2 className="text-xl font-bold mt-10 mb-2">Bereits eingetragene Tipps</h2>
      <ul className="space-y-2 w-full max-w-md">
        {allTips.map((t) => (
          <li key={t.id} className="flex justify-between items-center bg-neutral-800 rounded p-2">
            <div>
              <strong>{t.event}</strong> ({t.pick}) – {t.sport === "Football" ? "Fußball" : t.sport}
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
            >
              Löschen
            </button>
          </li>
        ))}
        {allTips.length === 0 && <li className="text-neutral-500">Noch keine Tipps vorhanden.</li>}
      </ul>
    </main>
  );
}
