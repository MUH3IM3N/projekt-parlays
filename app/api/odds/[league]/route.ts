import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { league: string } }
) => {
  const apiKey = process.env.ODDS_API_KEY; // <-- Deine ENV-Variable
  const league = decodeURIComponent(params.league);

  // Mapping: Admin-Panel-Name → API-Liga-Code (TheOddsAPI)
  const leagueMap: Record<string, string> = {
    // Deutschland
    "Bundesliga": "soccer_germany_bundesliga",
    "2. Bundesliga": "soccer_germany_bundesliga2",
    "3. Liga": "soccer_germany_bundesliga3",
    "DFB-Pokal": "soccer_germany_dfb_pokal",
    // England
    "Premier League": "soccer_epl",
    "Championship (England)": "soccer_uk_efl_champ",
    "FA Cup": "soccer_england_fa_cup",
    // Spanien
    "La Liga": "soccer_spain_la_liga",
    "Segunda División (Spanien)": "soccer_spain_segunda_division",
    "Copa del Rey": "soccer_spain_copa_del_rey",
    // Italien
    "Serie A": "soccer_italy_serie_a",
    "Serie B (Italien)": "soccer_italy_serie_b",
    "Coppa Italia": "soccer_italy_coppa_italia",
    // Frankreich
    "Ligue 1": "soccer_france_ligue_one",
    "Ligue 2 (Frankreich)": "soccer_france_ligue_two",
    "Coupe de France": "soccer_france_coupe_de_france",
    // Türkei, NL, BeNeLux
    "Süper Lig": "soccer_turkey_super_lig",
    "Eredivisie (Niederlande)": "soccer_netherlands_eredivisie",
    "Jupiler Pro League (Belgien)": "soccer_belgium_first_div",
    "Super League (Schweiz)": "soccer_switzerland_superleague",
    "Austrian Bundesliga": "soccer_austria_bundesliga",
    // International
    "Primeira Liga (Portugal)": "soccer_portugal_primeira_liga",
    "Champions League": "soccer_uefa_champs_league",
    "Europa League": "soccer_uefa_europa_league",
    "Conference League": "soccer_uefa_conference_league",
    "WM": "soccer_fifa_world_cup",
    "EM": "soccer_uefa_euro_2024",
    "Afrika Cup": "soccer_africa_cup_of_nations",
    "Copa America": "soccer_copa_america",
    "MLS (USA)": "soccer_usa_mls",
    "Brasileirao": "soccer_brazil_campeonato",
    // Extra
    "Andere internationale Liga": "soccer_other",
    "Freundschaftsspiel": "soccer_friendly",
  };

  // Mapping auf API-Liga-Code, falls im Panel eine exotische Liga gewählt wurde
  const apiLeague = leagueMap[league] || league;

  // Baue die URL für TheOddsAPI
  const url = `https://api.the-odds-api.com/v4/sports/${apiLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,spreads,totals`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Rückgabe der Original-Antwort (du kannst hier noch anpassen/filtern)
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "API-Fehler", details: String(err) }, { status: 500 });
  }
};
