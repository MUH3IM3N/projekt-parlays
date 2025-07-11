"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search } from "lucide-react";

// --------- Hilfs-Komponente für sichere Datumsausgabe ----------
function LocalizedDate({ dateString }: { dateString: string }) {
  const [date, setDate] = React.useState("");
  React.useEffect(() => {
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

// --- Types & Fallback ----------------------------------------
interface Leg {
  market: string;
  pick: string;
  odds: number;
  analyse?: string;
}
interface Tip {
  id: number;
  sport: "Football" | "Tennis";
  event: string;
  kickoff: string;
  combo?: boolean;
  status?: string;
  legs: Leg[];
  analyse?: string;
}
const fallbackTips: Tip[] = []; // Keine Dummy Tipps

// --- LocalStorage Ratings Helper -----------------------------
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

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>(fallbackTips);
  const [search, setSearch] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [overlay, setOverlay] = useState<{ tip: Tip; idx: number } | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const res = await fetch("/api/tips", { next: { revalidate: 60 } });
        if (!res.ok) throw new Error("/api/tips not configured – using fallback");
        const data = (await res.json()) as Tip[];
        if (Array.isArray(data) && data.length) setTips(data);
      } catch (err) {
        console.warn("Tip fetch failed, falling back to static list", err);
      } finally {
        setRatings(loadRatings());
      }
    };
    fetchTips();
  }, []);

  const visibleTips = useMemo(() => {
    return tips.filter((t) => {
      return (
        !search ||
        t.event.toLowerCase().includes(search.toLowerCase()) ||
        (t.legs || []).some(
          (leg) =>
            leg.market.toLowerCase().includes(search.toLowerCase()) ||
            leg.pick.toLowerCase().includes(search.toLowerCase())
        )
      );
    });
  }, [tips, search]);

  const vote = (tipId: number, val: number) => {
    if (ratings[tipId]) return;
    localStorage.setItem(`rating-${tipId}`, String(val));
    setRatings({ ...ratings, [tipId]: val });
  };

  // -------- Render ----------
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-6">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#00D2BE] drop-shadow-sm">
            Kombi‑Wetten &amp; Einzelwetten
          </h1>
          <p className="mt-1 text-base text-neutral-300">
            Fußball &amp; Tennis Vorhersagen • Quoten aktualisiert stündlich
          </p>
        </div>
        {/* Nur Suchleiste */}
        <div className="mx-auto flex w-full max-w-2xl">
          <div className="group relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 transition-colors duration-200 group-focus-within:text-[#00D2BE]" />
            <Input
              placeholder="Suche nach Team, Spieler oder Markt …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-neutral-600 bg-neutral-800/90 px-4 pl-12 text-sm font-medium placeholder-neutral-400 shadow-inner transition-all duration-300 focus:border-[#00D2BE]/80 focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40 group-focus-within:shadow-[#00D2BE]/20"
            />
          </div>
        </div>
      </header>

      {/* Kombi-Wetten */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00D2BE] tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-[#00D2BE] rounded px-2 py-1 text-neutral-900 text-base md:text-lg font-black shadow-sm">
            KOMBI-WETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => tip.combo).length === 0 && (
            <div className="text-neutral-400 col-span-full text-center">Keine Kombi-Wetten vorhanden.</div>
          )}
          {visibleTips
            .filter((tip) => tip.combo)
            .map((tip, idx) => (
              <Card
                key={tip.id}
                className="group relative overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#00D2BE]/80 hover:shadow-xl"
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-[#00D2BE]" />
                <CardContent className="flex flex-col gap-3 p-5 pl-6">
                  <div className="flex items-center justify-between text-sm font-medium text-neutral-400">
                    <span className="uppercase tracking-wide">
                      {tip.sport === "Football" ? "Fußball" : tip.sport}
                    </span>
                    <span>
                      <LocalizedDate dateString={tip.kickoff} />
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-50 transition-colors duration-300 group-hover:text-[#00D2BE]">
                    {tip.event}
                  </h2>
                  <div className="flex flex-col gap-1 mb-1">
                    {tip.legs &&
                      tip.legs.map((leg, i) => (
                        <div key={i} className="text-sm text-neutral-200 flex gap-2 items-center">
                          <span>
                            <strong>{leg.market}:</strong> {leg.pick} @ {leg.odds}
                          </span>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setOverlay({ tip, idx })}
                    className="mt-2 text-xs px-3 py-1 rounded-full bg-[#00D2BE] text-black font-bold hover:bg-[#00b0a1] transition"
                  >
                    Details & Analyse
                  </button>
                  <div className="mt-auto flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Star
                        key={val}
                        onClick={() => vote(tip.id, val)}
                        size={20}
                        className={
                          "cursor-pointer stroke-2 transition-colors duration-200 " +
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

      {/* Einzelwetten */}
      <section className="max-w-6xl mx-auto mt-14">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight mb-6 flex items-center gap-3">
          <span className="inline-block bg-neutral-700 rounded px-2 py-1 text-neutral-200 text-base md:text-lg font-black shadow-sm">
            EINZELWETTEN
          </span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleTips.filter((tip) => !tip.combo).length === 0 && (
            <div className="text-neutral-400 col-span-full text-center">Keine Einzelwetten vorhanden.</div>
          )}
          {visibleTips
            .filter((tip) => !tip.combo)
            .map((tip, idx) => (
              <Card
                key={tip.id}
                className="group relative overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800/95 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#00D2BE]/80 hover:shadow-xl"
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-neutral-700" />
                <CardContent className="flex flex-col gap-3 p-5 pl-6">
                  <div className="flex items-center justify-between text-sm font-medium text-neutral-400">
                    <span className="uppercase tracking-wide">
                      {tip.sport === "Football" ? "Fußball" : tip.sport}
                    </span>
                    <span>
                      <LocalizedDate dateString={tip.kickoff} />
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-50 transition-colors duration-300 group-hover:text-[#00D2BE]">
                    {tip.event}
                  </h2>
                  <div className="flex flex-col gap-1 mb-1">
                    {tip.legs &&
                      tip.legs.map((leg, i) => (
                        <div key={i} className="text-sm text-neutral-200 flex gap-2 items-center">
                          <span>
                            <strong>{leg.market}:</strong> {leg.pick} @ {leg.odds}
                          </span>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setOverlay({ tip, idx })}
                    className="mt-2 text-xs px-3 py-1 rounded-full bg-[#00D2BE] text-black font-bold hover:bg-[#00b0a1] transition"
                  >
                    Details & Analyse
                  </button>
                  <div className="mt-auto flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Star
                        key={val}
                        onClick={() => vote(tip.id, val)}
                        size={20}
                        className={
                          "cursor-pointer stroke-2 transition-colors duration-200 " +
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

      {/* Overlay für Details & Analyse */}
      {overlay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
          onClick={() => setOverlay(null)}
        >
          <div
            className="bg-neutral-900 rounded-xl max-w-lg w-full mx-4 p-8 relative shadow-2xl border border-[#00D2BE] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-5 text-neutral-400 hover:text-[#00D2BE] text-2xl font-bold"
              onClick={() => setOverlay(null)}
              aria-label="Schließen"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-2">{overlay.tip.event}</h3>
            <p className="text-sm mb-4 text-neutral-300">
              {overlay.tip.sport === "Football" ? "Fußball" : overlay.tip.sport} – <LocalizedDate dateString={overlay.tip.kickoff} />
            </p>
            <div className="space-y-2 mb-4">
              {overlay.tip.legs?.map((leg, i) => (
                <div key={i} className="bg-neutral-800 rounded p-2">
                  <b>{leg.market}</b>: {leg.pick} @ {leg.odds}
                  {leg.analyse && (
                    <p className="text-xs text-neutral-400 mt-1">{leg.analyse}</p>
                  )}
                </div>
              ))}
            </div>
            {overlay.tip.analyse && (
              <div className="mt-4 p-3 rounded bg-neutral-800 text-neutral-200 text-sm">
                <b>Gesamtanalyse:</b>
                <p className="mt-1">{overlay.tip.analyse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer – Legal Notice */}
      <footer className="mt-24 border-t border-neutral-700 pt-10 text-xs leading-relaxed text-neutral-400">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="font-semibold uppercase tracking-wide text-neutral-500">
            Rechtlicher Hinweis
          </p>
          <p>
            <strong>18+</strong> Glücksspiel kann abhängig machen. Bitte spiele verantwortungsbewusst. Kostenfreie Hilfe:
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
