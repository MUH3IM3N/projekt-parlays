"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search, Info } from "lucide-react";

type Leg = {
  league: string;
  event: string;
  market: string;
  pick: string;
  odds: number;
  analysis: string;
  kickoff: string;
};
type Tip = {
  id: number;
  sport: "Football" | "Tennis";
  combo: boolean;
  status: string;
  legs: Leg[];
};

function formatKickoff(dateStr: string) {
  if (!dateStr) return "--.-- --:--";
  try {
    // versuche ISO, sonst normal
    const dt = dateStr.includes("T")
      ? new Date(dateStr)
      : new Date(dateStr.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"));
    return dt.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tip | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const res = await fetch("/api/tips");
        if (!res.ok) return;
        const data = (await res.json()) as Tip[];
        setTips(data);
      } catch (err) {
        setTips([]);
      }
    };
    fetchTips();
  }, []);

  const visibleTips = tips.filter((tip) =>
    tip.legs.some(
      (leg) =>
        leg.event.toLowerCase().includes(search.toLowerCase()) ||
        (leg.league ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-6">
      <header className="mb-10 flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#00D2BE] drop-shadow-sm">
            Projekt Parlays – Tipps &amp; Analysen
          </h1>
          <p className="mt-1 text-base text-neutral-300">
            Fußball &amp; Tennis • Kombiwetten &amp; Einzelspiele
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-xl gap-4">
          <div className="group relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              placeholder="Suche nach Team, Liga oder Analyse …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-neutral-600 bg-neutral-800/90 px-4 pl-12 text-sm font-medium placeholder-neutral-400 shadow-inner focus:border-[#00D2BE]/80 focus:ring-2 focus:ring-[#00D2BE]/40"
            />
          </div>
        </div>
      </header>

      {/* Kombiwetten */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00D2BE] tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-[#00D2BE] rounded px-2 py-1 text-neutral-900 text-base md:text-lg font-black shadow-sm">
            KOMBI-WETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => tip.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md cursor-pointer hover:shadow-xl transition"
              onClick={() => setSelected(tip)}
            >
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-400">
                  <span className="uppercase tracking-wide">
                    {tip.sport === "Football" ? "Fußball" : tip.sport}
                  </span>
                  <span className="inline-block bg-[#00D2BE] text-black rounded px-2 py-0.5 text-xs font-bold ml-2">
                    Kombi ({tip.legs.length} Spiele)
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {tip.legs.map((leg, i) => (
                    <div key={i} className="flex flex-col mb-1">
                      <span className="font-bold">{leg.event}</span>
                      <span className="text-neutral-300 text-xs">
                        {leg.league} · {formatKickoff(leg.kickoff)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Info size={18} className="text-[#00D2BE]" />
                  <span className="text-xs text-[#00D2BE]">Für Details & Begründung klicken!</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Einzelwetten */}
      <section className="max-w-6xl mx-auto mt-12">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-neutral-700 rounded px-2 py-1 text-neutral-200 text-base md:text-lg font-black shadow-sm">
            EINZELWETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => !tip.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md cursor-pointer hover:shadow-xl transition"
              onClick={() => setSelected(tip)}
            >
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-400">
                  <span className="uppercase tracking-wide">
                    {tip.sport === "Football" ? "Fußball" : tip.sport}
                  </span>
                  <span className="inline-block bg-neutral-700 text-neutral-200 rounded px-2 py-0.5 text-xs font-bold ml-2">
                    Einzel
                  </span>
                </div>
                {tip.legs.map((leg, i) => (
                  <div key={i} className="flex flex-col mb-1">
                    <span className="font-bold">{leg.event}</span>
                    <span className="text-neutral-300 text-xs">
                      {leg.league} · {formatKickoff(leg.kickoff)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-2">
                  <Info size={18} className="text-[#00D2BE]" />
                  <span className="text-xs text-[#00D2BE]">Begründung & Details anzeigen</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Modal für Details */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#181e1e] rounded-2xl shadow-2xl max-w-lg w-full mx-2 p-8 relative text-neutral-100">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-neutral-300 hover:text-[#00D2BE] text-lg font-bold px-2 py-1 rounded"
            >
              ×
            </button>
            <h3 className="text-2xl font-extrabold text-[#00D2BE] mb-3">
              {selected.combo ? "Kombiwette" : "Einzelwette"}
            </h3>
            <div className="flex flex-col gap-4">
              {selected.legs.map((leg, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-800/80 rounded-xl px-4 py-3 mb-2"
                >
                  <div className="font-bold text-base">{leg.event}</div>
                  <div className="text-xs text-neutral-400 mb-1">
                    {leg.league} · {formatKickoff(leg.kickoff)}
                  </div>
                  <div className="text-neutral-200 text-sm mb-1">
                    <span className="font-semibold">{leg.market}</span>: {leg.pick} @ {leg.odds}
                  </div>
                  {leg.analysis && (
                    <div className="text-[#00D2BE] text-sm font-medium">
                      {leg.analysis}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <span
                className={`rounded px-3 py-1 text-xs font-bold ${
                  selected.status === "gewonnen"
                    ? "bg-green-600 text-white"
                    : selected.status === "verloren"
                    ? "bg-red-600 text-white"
                    : selected.status === "abgeschlossen"
                    ? "bg-neutral-400 text-black"
                    : "bg-[#00D2BE] text-black"
                }`}
              >
                {selected.status.toUpperCase()}
              </span>
              <span className="text-sm text-neutral-300">
                {selected.sport === "Football" ? "Fußball" : selected.sport}
              </span>
              {selected.combo && (
                <span className="text-sm text-[#00D2BE] font-semibold">
                  Gesamtkombi-Quote:{" "}
                  {selected.legs
                    .reduce((sum, l) => sum * (l.odds > 0 ? l.odds : 1), 1)
                    .toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 border-t border-neutral-700 pt-10 text-xs leading-relaxed text-neutral-400">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="font-semibold uppercase tracking-wide text-neutral-500">
            Rechtlicher Hinweis
          </p>
          <p>
            <strong>18+</strong> Glücksspiel kann abhängig machen. Bitte spiele verantwortungsbewusst.
            Hilfe:
            <a
              href="https://www.check-dein-spiel.de"
              className="ml-1 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bundeszentrale für gesundheitliche Aufklärung (0800 0 777 666)
            </a>
            .
          </p>
          <p>
            Die auf dieser Website veröffentlichten Sportwetten-Tipps stellen keinerlei Aufforderung zum Nachahmen dar. Es besteht <strong>keine Garantie auf Gewinne</strong>. Quoten können sich bis zum Spielbeginn ändern. Prüfe stets die gesetzlichen Bestimmungen in deinem Land, bevor du eine Wette eingehst.
          </p>
          <p>
            Alle Inhalte dienen ausschließlich Informationszwecken. Der Betreiber übernimmt keinerlei Verantwortung für Verluste, die durch Nutzung der veröffentlichten Informationen entstehen könnten.
          </p>
          <p className="pt-6 text-neutral-500">
            © {new Date().getFullYear()} Projekt Parlays · Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </main>
  );
}
