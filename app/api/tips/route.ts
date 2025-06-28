import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ODDS_API_KEY;
  if (!key) return NextResponse.json([], { status: 200 });

  // Nur Soccer und Tennis
  const sportsUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${key}`;
  const sportsRes = await fetch(sportsUrl);
  const sports = await sportsRes.json();

  const wantedSports = sports.filter(
    (s: any) => s.title === "Soccer" || s.title === "Tennis"
  );
  const sportKeys = wantedSports.map((s: any) => s.key);

  const tips: any[] = [];
  for (const sKey of sportKeys) {
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sKey}/odds/?apiKey=${key}&regions=eu&markets=h2h&oddsFormat=decimal`;
    const res = await fetch(oddsUrl, { next: { revalidate: 3600 } });
    const events = await res.json();

    // Bis zu 5 Events pro Sportart
    events.slice(0, 5).forEach((event: any, idx: number) => {
      const bookmaker = event.bookmakers?.[0];
      const market = bookmaker?.markets?.[0];
      const outcome = market?.outcomes?.[0];
      if (!bookmaker || !market || !outcome) return;
      tips.push({
        id: tips.length + 1,
        sport: sKey === "tennis" ? "Tennis" : "Football",
        event: event.home_team + " vs. " + event.away_team,
        market: market.key === "h2h" ? "Sieg" : market.key,
        pick: outcome.name,
        odds: outcome.price,
        kickoff: event.commence_time,
        combo: tips.length < 3, // Die ersten 3 werden als Kombi markiert
      });
    });
  }

  // Gib maximal 5 Tipps zurück (3 Kombi + 2 Einzel)
  return NextResponse.json(tips.slice(0, 5));
}
