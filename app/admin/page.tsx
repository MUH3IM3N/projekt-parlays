"use client";
import React, { useState } from "react";

export default function AdminPage() {
  const [tip, setTip] = useState({
    sport: "Fußball",
    event: "",
    market: "",
    pick: "",
    odds: "",
    kickoff: "",
    combo: false,
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  setTip((prev) => ({
    ...prev,
    [name]: type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value,
  }));
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTip = { ...tip, odds: parseFloat(tip.odds), id: Date.now() };
    const res = await fetch("/api/tips/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTip),
    });
    if (res.ok) {
      setMessage("Tipp gespeichert! Aktualisiere die Hauptseite.");
      setTip({ sport: "Fußball", event: "", market: "", pick: "", odds: "", kickoff: "", combo: false });
    } else {
      setMessage("Fehler beim Speichern!");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-bold mb-4">Neuen Tipp eintragen</h1>
      <form onSubmit={handleSubmit} className="bg-neutral-900 p-6 rounded-xl shadow-xl flex flex-col gap-4 w-full max-w-md">
        <select name="sport" value={tip.sport} onChange={handleChange} className="p-2 rounded">
          <option value="Fußball">Fußball</option>
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
    </main>
  );
}
