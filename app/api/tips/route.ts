import { NextResponse } from "next/server";
import { kv } from "@upstash/redis";

export async function GET() {
  // Hole alle Tipps aus KV
  const tips = (await kv.lrange("tips", 0, -1)) || [];
  return NextResponse.json(tips);
}