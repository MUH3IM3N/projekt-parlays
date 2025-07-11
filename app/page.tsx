"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search } from "lucide-react";

// --- Typen für dynamische legs ---
interface Leg {
  market: string;
  pick: string;
  odds: number;
}
interface Tip {
  id: number;
  sport: "Football" | "Tennis";
  event: string;
  kickoff: string;
  combo: boolean;
  status: string;
  legs: Leg[];
}

// --- Beispielhafte Fallbackdaten ---
const fallbackTips: Tip[] = [
  {
    id: 1,
    sport: "Football",
    event: "Bayern München vs. Borussia Dortmund",
    kickoff: "2025-08-15T18:30:00Z",
    combo: true,
    status: "offen",
    legs: [
      { market: "1X2", pick: "Bayern München", odds: 1.65 },
      { market: "Über/Unter", pick: "Über 2,5", odds: 1.80 },
      { market: "Beide treffen", pick: "Ja", odds: 1.55 }
    ]
  },
  {
    id: 2,
    sport: "Tennis",
    event: "ATP Cincinnati – Alcaraz vs. Sinner",
    kickoff: "2025-08-17T20:00:00Z",
    combo: false,
    status: "offen",
    legs: [
      { market: "Match Winner", pick: "J. Sinner", odds: 2.10 }
    ]
  }
];

// --- Hilfs-Komponente für sicheres Datum ---
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
  const [filterSport, setFilterSport] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, number>>({});

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
      const matchesSport = filterSport === "All" || t.sport === filterSport;
      const matchesSearch =
        !search || `${t.event} ${(t.legs || []).map(leg => leg.pick).join(" ")}`.toLowerCase().includes(search.toLowerCase());
      return matchesSport && matchesSearch;
    });
  }, [tips, filterSport, search]);

  const vote = (tipId: number, val: number) => {
    if (ratings[tipId]) return;
    localStorage.setItem(`rating-${tipId}`, String(val));
    setRatings({ ...ratings, [tipId]: val });
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-6">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#00D2BE] drop-shadow-sm">
            Daily Combo &amp; Pre‑Match Tips
          </h1>
          <p className="mt-1 text-base text-neutral-300">
            Fußball &amp; Tennis Vorhersagen • Quoten aktualisiert stündlich
          </p>
        </div>

        {/* Filterbar */}
        <div className="mx-auto flex w-full max-w-2xl gap-4">
          {/* Suchleiste */}
          <div className="group relative flex-[2]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 transition-colors duration-200 group-focus-within:text-[#00D2BE]" />
            <Input
              placeholder="Suche nach Team oder Spieler …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-neutral-600 bg-neutral-800/90 px-4 pl-12 text-sm font-medium placeholder-neutral-400 shadow-inner transition-all duration-300 focus:border-[#00D2BE]/80 focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40 group-focus-within:shadow-[#00D2BE]/20"
            />
          </div>
          <Select value={filterSport} onValueChange={setFilterSport}>
            <SelectTrigger className="h-12 w-24 rounded-full border border-neutral-600 bg-neutral-800/90 text-neutral-100 focus:ring-2 focus:ring-[#00D2BE]/40">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-neutral-600 bg-neutral-800 text-neutral-100">
              <SelectItem value="All">Alle</SelectItem>
              <SelectItem value="Football">Fußball</SelectItem>
              <SelectItem value="Tennis">Tennis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Hauptbereich: Kombi oben, Einzel darunter */}
      <section className="max-w-6xl mx-auto">
        {/* Kombi-Tipps */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#00D2BE] tracking-tight mb-6 flex items-center gap-3">
            <span className="inline-block bg-[#00D2BE] rounded px-2 py-1 text-neutral-900 text-base md:text-lg font-black shadow-sm">
              KOMBI DES TAGES
            </span>
            <span className="text-neutral-200 text-base md:text-lg font-semibold">
              (3er Kombi)
            </span>
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleTips.filter((tip) => tip.combo).map((tip) => (
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block bg-[#00D2BE] text-neutral-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                      Kombi
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-50 transition-colors duration-300 group-hover:text-[#00D2BE]">
                    {tip.event}
                  </h2>
                  <div className="flex flex-col gap-1">
                    {tip.legs.map((leg, idx) => (
                      <span className="text-sm text-neutral-200" key={idx}>
                        <strong>{leg.market}:</strong> {leg.pick} @ {leg.odds.toFixed(2)}
                      </span>
                    ))}
                  </div>
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
        </div>

        {/* Einzelwetten */}
        <div className="mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight mb-6 flex items-center gap-3">
            <span className="inline-block bg-neutral-700 rounded px-2 py-1 text-neutral-200 text-base md:text-lg font-black shadow-sm">
              EINZELWETTEN
            </span>
            <span className="text-neutral-300 text-base md:text-lg font-semibold">
              (Tipp des Tages)
            </span>
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleTips.filter((tip) => !tip.combo).map((tip) => (
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block bg-neutral-700 text-neutral-200 text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                      Einzel
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-50 transition-colors duration-300 group-hover:text-[#00D2BE]">
                    {tip.event}
                  </h2>
                  <div className="flex flex-col gap-1">
                    {tip.legs.map((leg, idx) => (
                      <span className="text-sm text-neutral-200" key={idx}>
                        <strong>{leg.market}:</strong> {leg.pick} @ {leg.odds.toFixed(2)}
                      </span>
                    ))}
                  </div>
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
        </div>
      </section>

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
