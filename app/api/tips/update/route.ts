import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
const redis = Redis.fromEnv();

export const POST = async (req: Request) => {
  const { id, odds } = await req.json();
  const tips = await redis.lrange("tips", 0, -1);
  const updated = tips.map((item: string) => {
    try {
      const tip = JSON.parse(item);
      if (tip.id === id) {
        // Update die Quote des ersten Legs (du kannst die Logik anpassen)
        if (tip.legs && tip.legs[0]) tip.legs[0].odds = odds;
      }
      return JSON.stringify(tip);
    } catch {
      return item;
    }
  });
  await redis.del("tips");
  await redis.rpush("tips", ...updated);
  return NextResponse.json({ success: true });
};
