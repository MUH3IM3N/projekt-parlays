// app/api/tips/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ODDS_API_KEY;
  if (!key) return NextResponse.json([], { status: 200 });

  // Beispiel API-Aufruf für Fußball
  const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${key}&regions=eu&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url);
  const events = await res.json();

  const tips = events.slice(0, 5).map((event: any, idx: number) => ({
    id: idx + 1,
    sport: "Football",
    event: event.home_team + " vs. " + event.away_team,
    market: "1X2",
    pick: event.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.name || "-",
    odds: event.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || 0,
    kickoff: event.commence_time,
    combo: idx < 3,
  }));

  return NextResponse.json(tips);
}
