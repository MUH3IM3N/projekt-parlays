import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Redis-Client initialisieren
const redis = Redis.fromEnv();

// Alle Tipps abrufen (GET)
export const GET = async () => {
  // Alle Tipps holen (als JSON-String gespeichert)
  const tips = await redis.lrange("tips", 0, -1);
  // Von JSON-String zu Objekt umwandeln
  const parsed = tips.map((item: string) => JSON.parse(item));
  return NextResponse.json(parsed);
};