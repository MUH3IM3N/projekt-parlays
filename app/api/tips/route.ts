import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const GET = async () => {
  // Alle Tipps holen
  const tips = await redis.lrange("tips", 0, -1);
  // Von JSON-String zu Objekt umwandeln
  const parsed = tips.map((item: string) => JSON.parse(item));
  return NextResponse.json(parsed);
};
