import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
const redis = Redis.fromEnv();

export const POST = async (req: Request) => {
  const newTip = await req.json();
  // GANZ WICHTIG: Hier als STRING speichern!
  await redis.rpush("tips", JSON.stringify(newTip));
  return NextResponse.json({ success: true });
};
