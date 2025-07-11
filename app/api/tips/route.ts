import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
const redis = Redis.fromEnv();

export const GET = async () => {
  const tips = await redis.lrange("tips", 0, -1);
  // Versuche alle zu parsen, überspringe kaputte!
  const parsed = tips
    .map((item: string) => {
      try {
        return JSON.parse(item);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  return NextResponse.json(parsed);
};
