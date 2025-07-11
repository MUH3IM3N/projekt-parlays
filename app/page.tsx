"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search, Trophy, Zap, X, ShieldCheck, Award } from "lucide-react";

// --- Typen ---
type Leg = {
  event: string;
  market: string;
  pick: string;
  odds: number;
  kickoff?: string;
  analysis?: string;
  legStatus?: "gewonnen"|"verloren"|"offen";
};
type Tip = {
  id: number;
  sport: string;
  league?: string;
  event?: string;
  combo: boolean;
  status?: "gewonnen"|"verloren"|"offen";
  analysis?: string;
  kickoff?: string;
  legs: Leg[];
};

function formatDate(str: string): string {
  if (!str) return "--.-- --:--";
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  return str;
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [search, setSearch] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    fetch("/api/tips").then(res => res.json()).then(setTips);
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

  // --- Tipps filtern (nach Suche) ---
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

  // --- Vergangene Tipps (gewonnen/verloren) für die neue Section! ---
  const vergangeneTipps = useMemo(() =>
    tips
      .filter(t => t.status === "gewonnen" || t.status === "verloren")
      .sort((a, b) =>
        b.kickoff && a.kickoff
          ? new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
          : 0
      ), [tips]);

  const vote = (tipId: number, val: number) => {
    if (ratings[tipId]) return;
    localStorage.setItem(`rating-${tipId}`, String(val));
    setRatings({ ...ratings, [tipId]: val });
  };

  // Prevent iOS/Android double scroll (page behind modal scrolls)
  useEffect(() => {
    if (selectedTip) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selectedTip]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-[#001b1c] to-[#00d2be12] text-neutral-100 pb-10">
      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-4 text-center relative">
        {/* ...dein Header bleibt unverändert... */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="text-[#FFD700] drop-shadow" size={34} />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#00D2BE] via-[#0ef1d9] to-[#ffd700] text-transparent bg-clip-text animate-pulse">
            Projekt Parlays
          </h1>
        </div>
        <div className="mb-2 flex flex-col md:flex-row items-center justify-center gap-4">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#00d2be11] border border-[#00D2BE] text-[#00D2BE] font-bold shadow-md animate-fadein">
            <Zap size={20} /> Täglich neue Kombi & Einzelwetten
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#222827] border border-[#FFD700] text-[#FFD700] font-bold shadow animate-fadein">
            <Award size={18} /> 100% Kostenfrei & Ohne Anmeldung
          </span>
        </div>
        <p className="text-base md:text-lg text-neutral-300 mt-2 mb-4">
          <span className="text-[#FFD700] font-bold">Analyse.</span> <span className="text-[#00D2BE] font-bold">Value.</span> <span className="text-neutral-200">Deine besten Sportwetten-Tipps.</span>
        </p>
        <div className="flex items-center justify-center mt-2">
          <ShieldCheck className="text-[#16a34a]" size={18} />
          <span className="ml-2 text-green-400 text-xs font-bold">Verantwortungsvolles Spielen</span>
        </div>
        <div className="mt-6 max-w-md mx-auto">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              placeholder="Suche nach Team, Liga, Event…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-[#00D2BE] bg-neutral-800/90 px-4 pl-12 text-sm font-medium placeholder-neutral-400 shadow-inner focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#00D2BE]/40 transition"
            />
          </div>
        </div>
      </section>

      {/* KOMBI-WETTEN */}
      <section className="max-w-5xl mx-auto px-4">
        {/* ...dein Kombi & Einzelwetten Code wie gehabt... */}

        <h2 className="text-2xl font-bold mb-4 text-[#00D2BE] tracking-widest flex items-center gap-2">
          <Zap size={24} className="animate-bounce" /> Kombi-Wetten
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {visibleTips.filter(t => t.combo && t.status === "offen").length === 0 && (
            <div className="text-neutral-500 p-6 border border-dashed border-neutral-600 rounded-xl text-center">
              Noch keine Kombi-Tipps eingetragen.
            </div>
          )}
          {visibleTips.filter(t => t.combo && t.status === "offen").map((tip) => (
            <Card
              key={tip.id}
              className="group relative rounded-2xl border border-neutral-600 bg-gradient-to-br from-[#031b20] via-[#112627] to-[#032629] shadow-xl hover:shadow-2xl transition hover:border-[#00D2BE] cursor-pointer overflow-hidden"
              onClick={() => setSelectedTip(tip)}
              style={{ minHeight: 180 }}
            >
              <span className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#FFD700] to-[#00D2BE]" />
              <CardContent className="flex flex-col gap-2 p-5 pl-7">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                  <span className="uppercase tracking-widest">{tip.league || "-"}</span>
                  <span>{tip.legs?.[0]?.kickoff ? formatDate(tip.legs[0].kickoff) : "-"}</span>
                </div>
                {/* Einzelne Legs als Liste */}
                <div className="flex flex-col gap-2 mb-2">
                  {tip.legs.map((l, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                      <span className="font-bold text-neutral-100">{l.event}</span>
                      <span className="text-xs text-neutral-300 bg-neutral-800/80 rounded px-2 py-0.5 md:ml-2">
                        {l.market}: <span className="text-[#FFD700] font-bold">{l.pick}</span> @ {l.odds}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#00D2BE] text-black font-bold px-3 py-0.5 rounded-full text-xs shadow-sm">Kombi</span>
                  <span className="text-xs text-neutral-400">Gesamtquote: <span className="text-[#FFD700] font-bold">{tip.legs.reduce((acc, l) => acc * (Number(l.odds) || 1), 1).toFixed(2)}</span></span>
                  <span className="text-xs text-neutral-400">{tip.legs.length} Spiele</span>
                </div>
                <div className="mt-auto flex gap-1">
                  {[1,2,3,4,5].map(val => (
                    <Star
                      key={val}
                      onClick={e => { e.stopPropagation(); vote(tip.id, val); }}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#FFD700] stroke-[#FFD700]"
                          : "stroke-neutral-400 group-hover:stroke-neutral-200")
                      }
                    />
                  ))}
                </div>
                {ratings[tip.id] && (
                  <span className="text-xs text-[#FFD700]">Danke fürs Bewerten!</span>
                )}
                <div className="absolute bottom-0 right-0 m-3">
                  <span className="animate-pulse bg-[#FFD700] text-black px-3 py-1 rounded-full font-black text-xs shadow-xl">Jetzt ansehen</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EINZELWETTEN */}
        <h2 className="text-2xl font-bold mb-4 mt-12 text-neutral-100 tracking-widest flex items-center gap-2">
          <Star className="text-[#FFD700]" size={20}/> Einzelwetten
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {visibleTips.filter(t => !t.combo && t.status === "offen").length === 0 && (
            <div className="text-neutral-500 p-6 border border-dashed border-neutral-600 rounded-xl text-center">
              Noch keine Einzelwetten eingetragen.
            </div>
          )}
          {visibleTips.filter(t => !t.combo && t.status === "offen").map((tip) => (
            <Card
              key={tip.id}
              className="group relative rounded-2xl border border-neutral-700 bg-gradient-to-br from-[#232b2c] via-[#1b2323] to-[#1e2e2e] shadow-lg hover:border-[#FFD700] transition cursor-pointer overflow-hidden"
              onClick={() => setSelectedTip(tip)}
            >
              <span className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#FFD700] to-[#222]" />
              <CardContent className="flex flex-col gap-3 p-6 pl-8">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                  <span className="uppercase tracking-widest">{tip.league || "-"}</span>
                  <span>{tip.legs?.[0]?.kickoff ? formatDate(tip.legs[0].kickoff) : "-"}</span>
                </div>
                <h2 className="text-lg font-black text-neutral-50 group-hover:text-[#FFD700]">
                  {tip.legs?.[0]?.event || tip.event || "-"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FFD700] text-black font-bold px-3 py-0.5 rounded-full text-xs shadow-sm">Einzel</span>
                  <span className="text-xs text-neutral-400">{tip.legs?.[0]?.market}: <span className="font-bold">{tip.legs?.[0]?.pick}</span> @ {tip.legs?.[0]?.odds}</span>
                </div>
                <div className="mt-auto flex gap-1">
                  {[1,2,3,4,5].map(val => (
                    <Star
                      key={val}
                      onClick={e => { e.stopPropagation(); vote(tip.id, val); }}
                      size={20}
                      className={
                        "cursor-pointer stroke-2 " +
                        (ratings[tip.id] && ratings[tip.id] >= val
                          ? "fill-[#FFD700] stroke-[#FFD700]"
                          : "stroke-neutral-400 group-hover:stroke-neutral-200")
                      }
                    />
                  ))}
                </div>
                {ratings[tip.id] && (
                  <span className="text-xs text-[#FFD700]">Danke fürs Bewerten!</span>
                )}
                <div className="absolute bottom-0 right-0 m-3">
                  <span className="animate-pulse bg-[#FFD700] text-black px-3 py-1 rounded-full font-black text-xs shadow-xl">Jetzt analysieren</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* --- VERGANGENE TIPPS SECTION: KOMMT HIER --- */}
      <section className="max-w-3xl mx-auto mt-12">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-extrabold mb-5 flex items-center gap-3 text-neutral-100">
            <span className="inline-block bg-gradient-to-r from-green-700 via-yellow-500 to-red-700 text-transparent bg-clip-text">
              Vergangene Tipps
            </span>
            <span className="text-neutral-400 text-base font-normal">({vergangeneTipps.length})</span>
          </h2>
          {vergangeneTipps.length === 0 && (
            <div className="text-neutral-400">Noch keine vergangenen Tipps eingetragen.</div>
          )}
          <div className="flex flex-col gap-5">
            {(showAllPast ? vergangeneTipps : vergangeneTipps.slice(0, 8)).map((tip) => (
              <div key={tip.id} className="rounded-xl border border-neutral-800 p-4 bg-neutral-800/70 shadow flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold">{tip.combo ? "Kombi" : "Einzel"} · {tip.league}</span>
                  {tip.status === "gewonnen" && <span className="bg-green-700 text-green-200 px-2 py-0.5 rounded-full text-xs font-bold">Gewonnen</span>}
                  {tip.status === "verloren" && <span className="bg-red-700 text-red-200 px-2 py-0.5 rounded-full text-xs font-bold">Verloren</span>}
                  <span className="ml-auto text-xs text-neutral-400">{tip.kickoff ? formatDate(tip.kickoff) : ""}</span>
                </div>
                {tip.combo ? (
                  <div className="flex flex-col gap-1">
                    {tip.legs.map((leg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-bold">{leg.event}</span>
                        <span className="text-xs">{leg.market}: {leg.pick} @ {leg.odds}</span>
                        {leg.legStatus === "gewonnen" && <span className="text-green-400">✔</span>}
                        {leg.legStatus === "verloren" && <span className="text-red-400">✗</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{tip.legs[0].event}</span>
                    <span className="text-xs">{tip.legs[0].market}: {tip.legs[0].pick} @ {tip.legs[0].odds}</span>
                  </div>
                )}
                {tip.analysis && (
                  <div className="mt-2 bg-neutral-900 rounded p-2 text-yellow-100 text-sm">{tip.analysis}</div>
                )}
              </div>
            ))}
          </div>
          {vergangeneTipps.length > 8 && !showAllPast && (
            <div className="text-center mt-6">
              <button
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-full text-neutral-100 font-bold shadow"
                onClick={() => setShowAllPast(true)}
              >
                Alle vergangenen Tipps anzeigen
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- MODAL und FOOTER bleiben wie gehabt ---------- */}
      {selectedTip && (
        // ...Dein Modal Code wie gehabt ...
        // KEINE Änderung nötig
      )}

      {/* FOOTER */}
      <footer className="mt-24 border-t border-neutral-700 pt-10 text-xs leading-relaxed text-neutral-400">
        {/* ...dein Footer-Code bleibt wie gehabt... */}
      </footer>
      <style>{`
        .animate-fadein { animation: fadein .8s; }
        @keyframes fadein { 0% { opacity: 0; transform: scale(.95);} 100% { opacity: 1; transform: scale(1);}}
        @media (max-width: 600px) {
          .fixed.z-50>div {
            border-width: 2px !important;
          }
        }
      `}</style>
    </main>
  );
}
