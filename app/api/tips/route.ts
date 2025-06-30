import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const GET = async () => {
  // Alle Tipps holen (als Strings)
  const tipStrings = (await redis.lrange("tips", 0, -1)) as string[];
  // In Objekte umwandeln
  const tips = tipStrings.map((t) => JSON.parse(t));
  return NextResponse.json(tips);
};