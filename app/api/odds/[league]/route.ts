// app/api/odds/[league]/route.ts
import { NextResponse } from "next/server";

// Next.js App Router API-Route – dynamischer Parameter [league]
export async function GET(
  request: Request,
  { params }: { params: { league: string } }
) {
  const { league } = params;

  // Optional: Du kannst "?event=..." in der URL mitgeben (z.B. für Feinsuche)
  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event"); // (muss nicht genutzt werden)

  // Deinen API-Key aus ENV holen (Vercel: ODDS_API_KEY eintragen!)
  const API_KEY = process.env.ODDS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: "API-Key fehlt in ENV!" }, { status: 500 });
  }

  // Odds API-URL (hier Beispiel: The Odds API)
  // Siehe https://the-odds-api.com/sports-odds/
  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Quote API nicht erreichbar", details: await res.text() }, { status: res.status });
    }
    const data = await res.json();
    // Optional: Event-Filtern (nur Beispiel)
    // if (event) { ... }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "Fehler beim API-Call", details: e.message }, { status: 500 });
  }
}
