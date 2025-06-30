"use client";
import React, { useState, useEffect } from "react";

export default function AdminPage() {
  // State für das aktuelle Tipp-Formular
  const [tip, setTip] = useState({
    sport: "Football",
    event: "",
    market: "",
    pick: "",
    odds: "",
    kickoff: "",
    combo: false,
  });

  // State für die Liste ALLER Tipps
  const [allTips, setAllTips] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // Alle Tipps laden, wenn die Seite geladen wird
  useEffect(() => {
    fetch("/api/tips")
      .then((res) => res.json())
      .then(setAllTips);
  }, []);

  // Wenn ein Formularfeld geändert wird
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

  // Formular absenden (Tipp speichern)
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
      setTip({ sport: "Football", event: "", market: "", pick: "", odds: "", kickoff: "", combo: false });
      // Nach dem Speichern die Liste aktualisieren:
      fetch("/api/tips")
        .then((res) => res.json())
        .then(setAllTips);
    } else {
      setMessage("Fehler beim Speichern!");
    }
  };

  // Tipp löschen
  const handleDelete = async (id: number) => {
    await fetch("/api/tips/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAllTips((tips) => tips.filter((t) => t.id !== id));
  };

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
