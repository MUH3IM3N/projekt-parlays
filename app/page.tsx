"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search, X } from "lucide-react";

// Helper zum Formatieren von Datum/Zeit
function formatDate(str: string) {
  if (!str) return "--.-- --:--";
  // Falls ISO oder "2025-08-10T15:30"
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  // Falls "11.07.2025 - 14:00" etc.
  return str;
}

// ------------------- TYPEN --------------------
type Leg = {
  event: string;
  market: string;
  pick: string;
  odds: number;
  kickoff?: string;
  analysis?: string;
};
type Tip = {
  id: number;
  sport: string;
  league?: string;
  event?: string;
  combo: boolean;
  status?: string;
  analysis?: string;
  kickoff?: string;
  legs: Leg[];
};

// -------------- Frontpage-Komponente --------------
export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [search, setSearch] = useState("");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);

  // Lade Tipps beim Start
  useEffect(() => {
    fetch("/api/tips").then(res => res.json()).then(setTips);
    // Lade evt. Ratings
    if (typeof window !== "undefined") {
      const r: Record<number, number> = {};
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("rating-")) {
          const id = Number(k.replace("rating-", ""));
          const v = Number(localStorage.getItem(k));
          if (!isNaN(id) && v) r[id] = v;
        }
      });
      setRatings(r);
    }
  }, []);

  // Suche nach Event/Team
  const visibleTips = useMemo(() => {
    return tips.filter((t) =>
      !search ||
      t.event?.toLowerCase().includes(search.toLowerCase()) ||
      t.legs.some(l =>
        l.event?.toLowerCase().includes(search.toLowerCase()) ||
        l.pick?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [tips, search]);

  // Sterne-Bewertung
  const vote = (tipId: number, val: number) => {
    if (ratings[tipId]) return;
    localStorage.setItem(`rating-${tipId}`, String(val));
    setRatings({ ...ratings, [tipId]: val });
  };

  // -------- Render --------
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-6">
      {/* HEADER */}
      <header className="mb-10 flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#00D2BE] drop-shadow-sm">
            Projekt Parlays – Sportwetten Tipps
          </h1>
          <p className="mt-1 text-base text-neutral-300">
            Fußball &amp; Tennis Vorhersagen – Quoten, Kickoff &amp; Analyse
          </p>
        </div>
        {/* Nur Suchleiste */}
        <div className="mx-auto w-full max-w-xl">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              placeholder="Suche nach Team, Event, Tipp…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-neutral-600 bg-neutral-800/90 px-4 pl-12 text-sm font-medium placeholder-neutral-400 shadow-inner focus:border-[#00D2BE]/80 focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40"
            />
          </div>
        </div>
      </header>

      {/* KOMBI-WETTEN */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-[#00D2BE] tracking-widest">KOMBI-WETTEN</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {visibleTips.filter(t => t.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md transition hover:border-[#00D2BE]"
              onClick={() => setSelectedTip(tip)}
            >
              <span className="absolute left-0 top-0 w-1 h-full bg-[#00D2BE]" />
              <CardContent className="flex flex-col gap-2 p-5 pl-6 cursor-pointer">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{tip.league || "-"}</span>
                  <span>{tip.legs?.[0]?.kickoff ? formatDate(tip.legs[0].kickoff) : "-"}</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-50 group-hover:text-[#00D2BE]">
                  {tip.legs.map(l => l.event).filter(Boolean).join(" + ")}
                </h2>
                <p className="text-xs text-neutral-300">
                  {tip.legs.length} Spiele • Kombi-Quote: <b>
                    {tip.legs.reduce((acc, l) => acc * (Number(l.odds) || 1), 1).toFixed(2)}
                  </b>
                </p>
                <div className="mt-auto flex gap-1">
                  {[1,2,3,4,5].map(val => (
                    <Star
                      key={val}
                      onClick={e => { e.stopPropagation(); vote(tip.id, val); }}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#00D2BE] stroke-[#00D2BE]"
                          : "stroke-neutral-400 group-hover:stroke-neutral-300")
                      }
                    />
                  ))}
                </div>
                {ratings[tip.id] && (
                  <span className="text-xs text-[#00D2BE]">Danke fürs Bewerten!</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EINZELWETTEN */}
        <h2 className="text-2xl font-bold mb-4 mt-10 text-neutral-200 tracking-widest">EINZELWETTEN</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {visibleTips.filter(t => !t.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md transition hover:border-[#00D2BE]"
              onClick={() => setSelectedTip(tip)}
            >
              <span className="absolute left-0 top-0 w-1 h-full bg-neutral-700" />
              <CardContent className="flex flex-col gap-2 p-5 pl-6 cursor-pointer">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{tip.league || "-"}</span>
                  <span>{tip.legs?.[0]?.kickoff ? formatDate(tip.legs[0].kickoff) : "-"}</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-50 group-hover:text-[#00D2BE]">
                  {tip.legs?.[0]?.event || tip.event || "-"}
                </h2>
                <p className="text-xs text-neutral-300">
                  {tip.legs?.[0]?.market || "-"}: <b>{tip.legs?.[0]?.pick}</b> @ {tip.legs?.[0]?.odds}
                </p>
                <div className="mt-auto flex gap-1">
                  {[1,2,3,4,5].map(val => (
                    <Star
                      key={val}
                      onClick={e => { e.stopPropagation(); vote(tip.id, val); }}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#00D2BE] stroke-[#00D2BE]"
                          : "stroke-neutral-400 group-hover:stroke-neutral-300")
                      }
                    />
                  ))}
                </div>
                {ratings[tip.id] && (
                  <span className="text-xs text-[#00D2BE]">Danke fürs Bewerten!</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- OVERLAY ---------- */}
      {selectedTip && (
        <div className="fixed z-50 inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-neutral-900 border border-[#00D2BE] rounded-2xl shadow-2xl p-7 max-w-lg w-full relative">
            <button className="absolute right-5 top-5 text-neutral-400 hover:text-[#00D2BE]" onClick={() => setSelectedTip(null)}>
              <X size={28} />
            </button>
            <h2 className="text-xl font-bold mb-1 text-[#00D2BE]">
              {selectedTip.combo ? "Kombi-Wette" : "Einzelwette"}
            </h2>
            <div className="text-neutral-300 text-sm mb-2">
              <b>{selectedTip.league}</b>
              {selectedTip.kickoff && (
                <> – <span>{formatDate(selectedTip.kickoff)}</span></>
              )}
              {selectedTip.status && (
                <> – <span>{selectedTip.status}</span></>
              )}
            </div>
            <div className="divide-y divide-neutral-700">
              {selectedTip.legs.map((leg, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-neutral-100">{leg.event}</div>
                      <div className="text-neutral-400 text-xs">
                        {selectedTip.sport === "Football" ? "Fußball" : selectedTip.sport}
                        {selectedTip.league ? <> • <span>{selectedTip.league}</span></> : null}
                      </div>
                      {leg.kickoff && (
                        <div className="text-xs text-neutral-300">Kickoff: {formatDate(leg.kickoff)}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-neutral-400">{leg.market}</span>
                      <span className="block text-lg font-bold text-[#00D2BE]">{leg.pick} @ {leg.odds}</span>
                    </div>
                  </div>
                  {leg.analysis && (
                    <div className="mt-2 text-sm text-neutral-200 italic bg-neutral-800 rounded p-2">{leg.analysis}</div>
                  )}
                </div>
              ))}
            </div>
            {/* Kombi-Analyse */}
            {selectedTip.analysis && (
              <div className="mt-4 text-sm text-neutral-200 bg-[#003c4c] rounded p-3">{selectedTip.analysis}</div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTip(null)}
                className="bg-[#00D2BE] hover:bg-[#008e95] text-black px-5 py-2 rounded-lg font-bold shadow"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------- FOOTER ----------- */}
      <footer className="mt-24 border-t border-neutral-700 pt-10 text-xs leading-relaxed text-neutral-400">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="font-semibold uppercase tracking-wide text-neutral-500">Rechtlicher Hinweis</p>
          <p>
            <strong>18+</strong> Glücksspiel kann abhängig machen. Bitte spiele verantwortungsbewusst.
            Kostenfreie Hilfe:
            <a
              href="https://www.check-dein-spiel.de"
              className="ml-1 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-200 hover:decoration-neutral-200"
              target="_blank" rel="noopener noreferrer">
              Bundeszentrale für gesundheitliche Aufklärung (0800 0 777 666)
            </a>.
          </p>
          <p>
            Die auf dieser Website veröffentlichten Sportwetten-Tipps stellen keinerlei Aufforderung zum Nachahmen dar.
            Es besteht <strong>keine Garantie auf Gewinne</strong>. Quoten können sich bis zum Spielbeginn ändern.
            Prüfe stets die gesetzlichen Bestimmungen in deinem Land, bevor du eine Wette eingehst.
          </p>
          <p>
            Alle Inhalte dienen ausschließlich Informationszwecken. Der Betreiber übernimmt keinerlei Verantwortung für
            Verluste, die durch Nutzung der veröffentlichten Informationen entstehen könnten.
          </p>
          <p className="pt-6 text-neutral-500">
            © {new Date().getFullYear()} Projekt Parlays · Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </main>
  );
}
