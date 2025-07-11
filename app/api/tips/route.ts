import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
const redis = Redis.fromEnv();

export const GET = async () => {
  const tips = await redis.lrange("tips", 0, -1);
  const parsed = tips
    .map((item: any) => {
      try {
        // Falls item schon Objekt ist (was falsch ist), nimm direkt. Sonst parse.
        if (typeof item === "string") return JSON.parse(item);
        return item;
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  return NextResponse.json(parsed);
};
