import { NextResponse } from "next/server";

export async function GET(request: Request, context: any) {
  const { league } = context.params;
  const API_KEY = process.env.ODDS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: "API-Key fehlt in ENV!" }, { status: 500 });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=eu&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Quote API nicht erreichbar", details: await res.text() },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fehler beim API-Call", details: e.message },
      { status: 500 }
    );
  }
}
