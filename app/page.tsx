"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Star, Search, Info } from "lucide-react";

// ----- Localized Date Helper -----
function LocalizedDate({ dateString }: { dateString: string }) {
  const [date, setDate] = React.useState("");
  useEffect(() => {
    if (!dateString) return setDate("--.-- --:--");
    setDate(
      new Date(dateString).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [dateString]);
  return <>{date || "--.-- --:--"}</>;
}

// --- Types ---
interface Leg {
  market: string;
  pick: string;
  odds: number;
}
interface Tip {
  id: number;
  sport: string;
  league: string;
  event: string;
  kickoff: string;
  combo: boolean;
  status: string;
  analysis?: string;
  legs: Leg[];
}

// --- Ratings Helper ---
const loadRatings = (): Record<number, number> => {
  const out: Record<number, number> = {};
  if (typeof window === "undefined") return out;
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("rating-")) {
      const id = Number(k.replace("rating-", ""));
      const v = Number(localStorage.getItem(k));
      if (!Number.isNaN(id) && v) out[id] = v;
    }
  });
  return out;
};

export default function HomePage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [search, setSearch] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [openTip, setOpenTip] = useState<number | null>(null);

  // Tipps laden
  useEffect(() => {
    const fetchTips = async () => {
      try {
        const res = await fetch("/api/tips", { next: { revalidate: 60 } });
        if (!res.ok) throw new Error("/api/tips not configured");
        const data = (await res.json()) as Tip[];
        if (Array.isArray(data) && data.length) setTips(data);
      } catch (err) {
        setTips([]);
      } finally {
        setRatings(loadRatings());
      }
    };
    fetchTips();
  }, []);

  // Suchfunktion (auch nach Liga, Markt, Pick, Analyse)
  const visibleTips = useMemo(() => {
    return tips.filter((t) => {
      const haystack = `${t.event} ${t.league} ${t.status} ${t.legs?.map(l => l.pick).join(" ")} ${t.analysis || ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [tips, search]);

  // Votes
  const vote = (tipId: number, val: number) => {
    if (ratings[tipId]) return;
    localStorage.setItem(`rating-${tipId}`, String(val));
    setRatings({ ...ratings, [tipId]: val });
  };

  // Get Kombi-Gesamtquote
  function calcKombiQuote(legs: Leg[]) {
    return legs.reduce((acc, cur) => acc * (Number(cur.odds) || 1), 1).toFixed(2);
  }

  // UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#191f1f] to-[#001b1c] text-neutral-100 p-4 md:p-10">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#00D2BE] drop-shadow mb-2">
          Projekt Parlays – Fußball &amp; Tennis Tipps
        </h1>
        <p className="text-lg text-neutral-300">
          Experten Kombi-Wetten & Einzelwetten – Quoten, Analyse und mehr
        </p>
      </header>

      {/* Suche */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Suche nach Team, Liga, Markt, Analyse …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-full border border-neutral-600 bg-neutral-800/90 pl-12 text-base font-medium shadow-inner focus:border-[#00D2BE]/80 focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40"
          />
        </div>
      </div>

      {/* Kombi-Wetten */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00D2BE] tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-[#00D2BE] rounded px-2 py-1 text-neutral-900 font-black shadow-sm">
            KOMBI-WETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => tip.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md hover:shadow-lg transition-all"
            >
              <span className="absolute left-0 top-0 w-1 h-full bg-[#00D2BE]" />
              <CardContent className="flex flex-col gap-2 p-5 pl-6">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-2">
                  <span className="uppercase tracking-wide">{tip.sport === "Football" ? "Fußball" : tip.sport}</span>
                  <span>
                    <LocalizedDate dateString={tip.kickoff} />
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block bg-[#00D2BE] text-neutral-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">Kombi</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-300">{tip.league}</span>
                  <span className="ml-auto text-xs text-neutral-400">{tip.status}</span>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
                  {tip.event}
                </h2>
                {/* Legs */}
                <div className="flex flex-col gap-1 mt-2">
                  {tip.legs.map((leg, i) => (
                    <div key={i} className="flex flex-row gap-2 text-neutral-200 text-sm">
                      <span className="bg-[#00D2BE] text-black rounded px-2 py-0.5 font-bold">{leg.market}</span>
                      <span>{leg.pick}</span>
                      <span className="ml-auto text-neutral-300 font-bold">@ {Number(leg.odds).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-bold text-[#00D2BE]">Kombi-Quote: {calcKombiQuote(tip.legs)}</span>
                  {/* Detail-Overlay Button */}
                  <button
                    onClick={() => setOpenTip(openTip === tip.id ? null : tip.id)}
                    className="text-xs text-neutral-200 bg-[#00D2BE]/10 hover:bg-[#00D2BE]/30 rounded px-3 py-1 flex items-center gap-1 font-semibold transition"
                  >
                    <Info size={16} /> Details
                  </button>
                </div>
                {/* Overlay */}
                {openTip === tip.id && (
                  <div className="absolute inset-0 bg-[#101417]/95 flex flex-col justify-center items-center rounded-2xl shadow-2xl z-30 p-7">
                    <div className="w-full text-center">
                      <h3 className="font-bold text-lg text-[#00D2BE] mb-3">Kombi-Analyse</h3>
                      {tip.analysis
                        ? <div className="mb-3 text-base">{tip.analysis}</div>
                        : <div className="mb-3 text-neutral-400">Keine Analyse vorhanden.</div>
                      }
                      <button onClick={() => setOpenTip(null)}
                        className="mt-3 px-5 py-2 rounded bg-[#00D2BE] text-black font-bold hover:bg-[#00c2ae] transition">
                        Schließen
                      </button>
                    </div>
                  </div>
                )}
                {/* Rating */}
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <Star
                      key={val}
                      onClick={() => vote(tip.id, val)}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 transition-colors duration-200 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#00D2BE] stroke-[#00D2BE]"
                          : "stroke-neutral-400 hover:stroke-[#00D2BE]")
                      }
                    />
                  ))}
                  {ratings[tip.id] && (
                    <span className="ml-2 text-xs text-[#00D2BE]">Danke fürs Bewerten!</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Einzelwetten */}
      <section className="max-w-5xl mx-auto mt-20">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-neutral-700 rounded px-2 py-1 text-neutral-200 font-black shadow-sm">
            EINZELWETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => !tip.combo).map((tip) => (
            <Card
              key={tip.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900/95 shadow-md hover:shadow-lg transition-all"
            >
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-400 mb-2">
                  <span className="uppercase tracking-wide">{tip.sport === "Football" ? "Fußball" : tip.sport}</span>
                  <span>
                    <LocalizedDate dateString={tip.kickoff} />
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-300">{tip.league}</span>
                  <span className="ml-auto text-xs text-neutral-400">{tip.status}</span>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
                  {tip.event}
                </h2>
                <div className="flex flex-col gap-1 mt-2">
                  {tip.legs.map((leg, i) => (
                    <div key={i} className="flex flex-row gap-2 text-neutral-200 text-sm">
                      <span className="bg-neutral-700 text-white rounded px-2 py-0.5 font-bold">{leg.market}</span>
                      <span>{leg.pick}</span>
                      <span className="ml-auto text-neutral-300 font-bold">@ {Number(leg.odds).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {/* Overlay-Button */}
                <div className="flex items-center justify-between mt-3">
                  <span />
                  <button
                    onClick={() => setOpenTip(openTip === tip.id ? null : tip.id)}
                    className="text-xs text-neutral-200 bg-[#00D2BE]/10 hover:bg-[#00D2BE]/30 rounded px-3 py-1 flex items-center gap-1 font-semibold transition"
                  >
                    <Info size={16} /> Details
                  </button>
                </div>
                {/* Overlay */}
                {openTip === tip.id && (
                  <div className="absolute inset-0 bg-[#101417]/95 flex flex-col justify-center items-center rounded-2xl shadow-2xl z-30 p-7">
                    <div className="w-full text-center">
                      <h3 className="font-bold text-lg text-[#00D2BE] mb-3">Begründung zum Tipp</h3>
                      {tip.analysis
                        ? <div className="mb-3 text-base">{tip.analysis}</div>
                        : <div className="mb-3 text-neutral-400">Keine Analyse vorhanden.</div>
                      }
                      <button onClick={() => setOpenTip(null)}
                        className="mt-3 px-5 py-2 rounded bg-[#00D2BE] text-black font-bold hover:bg-[#00c2ae] transition">
                        Schließen
                      </button>
                    </div>
                  </div>
                )}
                {/* Rating */}
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <Star
                      key={val}
                      onClick={() => vote(tip.id, val)}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 transition-colors duration-200 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#00D2BE] stroke-[#00D2BE]"
                          : "stroke-neutral-400 hover:stroke-[#00D2BE]")
                      }
                    />
                  ))}
                  {ratings[tip.id] && (
                    <span className="ml-2 text-xs text-[#00D2BE]">Danke fürs Bewerten!</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-neutral-800 pt-10 text-xs leading-relaxed text-neutral-400">
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="font-semibold uppercase tracking-wide text-neutral-500">
            Rechtlicher Hinweis
          </p>
          <p>
            <strong>18+</strong> Glücksspiel kann abhängig machen. Bitte spiele verantwortungsbewusst.
            Kostenfreie Hilfe:
            <a
              href="https://www.check-dein-spiel.de"
              className="ml-1 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-200 hover:decoration-neutral-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bundeszentrale für gesundheitliche Aufklärung (0800 0 777 666)
            </a>
            .
          </p>
          <p>
            Die auf dieser Website veröffentlichten Sportwetten-Tipps stellen keinerlei Aufforderung zum Nachahmen dar.
            Es besteht <strong>keine Garantie auf Gewinne</strong>. Quoten können sich bis zum Spielbeginn ändern.
            Prüfe stets die gesetzlichen Bestimmungen in deinem Land, bevor du eine Wette eingehst.
          </p>
          <p>
            Alle Inhalte dienen ausschließlich Informationszwecken. Der Betreiber übernimmt keinerlei Verantwortung für Verluste,
            die durch Nutzung der veröffentlichten Informationen entstehen könnten.
          </p>
          <p className="pt-6 text-neutral-500">
            © {new Date().getFullYear()} Projekt Parlays · Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </main>
  );
}
