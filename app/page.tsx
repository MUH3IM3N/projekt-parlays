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
        <h2 className="text-2xl font-bold mb-4 text-[#00D2BE] tracking-widest flex items-center gap-2">
          <Zap size={24} className="animate-bounce" /> Kombi-Wetten
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {visibleTips.filter(t => t.combo).length === 0 && (
            <div className="text-neutral-500 p-6 border border-dashed border-neutral-600 rounded-xl text-center">
              Noch keine Kombi-Tipps eingetragen.
            </div>
          )}
          {visibleTips.filter(t => t.combo).map((tip) => (
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
          {visibleTips.filter(t => !t.combo).length === 0 && (
            <div className="text-neutral-500 p-6 border border-dashed border-neutral-600 rounded-xl text-center">
              Noch keine Einzelwetten eingetragen.
            </div>
          )}
          {visibleTips.filter(t => !t.combo).map((tip) => (
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

      {/* ---------- KOMPLETT NEUES, MOBIL-OPTIMIERTES MODAL ---------- */}
      {selectedTip && (
        <div
          className="fixed z-50 inset-0 flex items-center justify-center bg-black/70"
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
          style={{ touchAction: "none" }}
          onClick={() => setSelectedTip(null)}
        >
          {/* Modal-Inhalt, Clicks werden nicht propagiert */}
          <div
            className="relative rounded-2xl border-2 border-[#FFD700] bg-neutral-900 shadow-2xl max-w-[97vw] w-full sm:max-w-xl mx-2 flex flex-col"
            style={{
              maxHeight: "95vh",
              minHeight: "fit-content",
              boxShadow: "0 6px 36px 0 #000a, 0 1.5px 10px 0 #FFD70040",
              overflow: "hidden",
              margin: "10px 0"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Schließen-Button oben */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-950/90 sticky top-0 z-10">
              <h2 className="text-base sm:text-lg font-black text-[#FFD700] tracking-wide truncate">
                {selectedTip.combo ? "Kombi-Wette" : "Einzelwette"}
              </h2>
              <button
                className="ml-3 rounded-full bg-neutral-800 hover:bg-[#FFD700]/20 transition p-2"
                style={{ touchAction: "manipulation" }}
                aria-label="Schließen"
                onClick={() => setSelectedTip(null)}
              >
                <X size={28} className="text-[#FFD700]" />
              </button>
            </div>

            {/* Modal-Content, scrollbar! */}
            <div
              className="flex-1 overflow-y-auto px-3 pt-2 pb-3"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                maxHeight: "64vh"
              }}
            >
              <div className="mb-3 text-center">
                <span className="block text-xs text-neutral-400 font-medium">
                  {selectedTip.league}
                  {selectedTip.kickoff && (
                    <> • <span>{formatDate(selectedTip.kickoff)}</span></>
                  )}
                  {selectedTip.status && (
                    <> • <span>{selectedTip.status}</span></>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                {selectedTip.legs.map((leg, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-neutral-700 bg-neutral-800/80 shadow-sm px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                  >
                    <div>
                      <div className="font-bold text-neutral-100 text-base">{leg.event}</div>
                      <div className="text-xs text-neutral-400">
                        {leg.market}{leg.kickoff ? <> • <span>{formatDate(leg.kickoff)}</span></> : null}
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className="text-base font-bold text-[#FFD700]">{leg.pick} @ {leg.odds}</span>
                      {leg.analysis && (
                        <div className="mt-1 text-xs text-yellow-200 italic bg-neutral-900 rounded px-2 py-1 max-w-xs">
                          {leg.analysis}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTip.analysis && (
                <div className="mb-4 text-sm text-yellow-200 bg-[#362c0b] rounded-xl p-3 shadow-inner">
                  {selectedTip.analysis}
                </div>
              )}
            </div>

            {/* Sticky Schließen-Button unten! */}
            <div className="sticky bottom-0 z-20 bg-neutral-950/95 border-t border-neutral-800 flex justify-center p-3">
              <button
                className="w-full max-w-xs bg-[#FFD700] hover:bg-[#e4bb00] text-black text-base font-bold px-5 py-2 rounded-lg shadow transition"
                style={{ touchAction: "manipulation" }}
                onClick={() => setSelectedTip(null)}
              >
                Schließen
              </button>
            </div>
          </div>
          <style>{`
            @media (max-width: 600px) {
              .fixed.z-50>div {
                border-width: 2px !important;
              }
              .fixed.z-50 .text-base { font-size: 1.03rem !important; }
              .fixed.z-50 .text-lg { font-size: 1.08rem !important; }
              .fixed.z-50 .text-xs { font-size: .96rem !important; }
              .fixed.z-50 button[aria-label="Schließen"] { font-size: 22px !important; }
              .fixed.z-50 .sticky.bottom-0 { padding-bottom: 16px !important; }
            }
          `}</style>
        </div>
      )}

      {/* FOOTER */}
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
