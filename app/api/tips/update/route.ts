import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
const redis = Redis.fromEnv();

export const PATCH = async (req: Request) => {
  const { id, status, legs } = await req.json();

  // Lade alle Tipps aus Redis
  const tips = await redis.lrange("tips", 0, -1);

  const updated = tips.map((item: string) => {
    try {
      let tip = JSON.parse(item);
      if (tip.id === id) {
        if (typeof status !== "undefined") tip.status = status;
        if (Array.isArray(legs)) tip.legs = legs;
      }
      return JSON.stringify(tip);
    } catch {
      return item;
    }
  });

  // Überschreibe alle Tipps
  await redis.del("tips");
  await redis.rpush("tips", ...updated);

  return NextResponse.json({ success: true });
};

export const POST = PATCH;
