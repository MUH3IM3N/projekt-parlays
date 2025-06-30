import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Redis mit Umgebungsvariablen initialisieren (Upstash stellt sie bereit)
const redis = Redis.fromEnv();

export const POST = async (req: Request) => {
  const newTip = await req.json(); // Holt den neuen Tipp aus dem Request

  // Tipp als String speichern (z.B. in einer Liste)
  await redis.rpush("tips", JSON.stringify(newTip));

  return NextResponse.json({ success: true });
};
