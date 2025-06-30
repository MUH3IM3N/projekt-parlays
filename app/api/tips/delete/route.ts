import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const POST = async (req: Request) => {
  const { id } = await req.json();
  // Hole alle Tipps
  const tipStrings = (await redis.lrange("tips", 0, -1)) as string[];
  // Suche den Tipp mit passender ID
  const toRemove = tipStrings.find((t) => JSON.parse(t).id === id);
  if (toRemove) {
    await redis.lrem("tips", 1, toRemove);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Tipp nicht gefunden" });
};
