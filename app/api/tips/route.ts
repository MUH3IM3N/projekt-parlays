import { NextResponse } from "next/server";
import { kv } from "@upstash/kv";

export async function GET() {
  const tips = (await kv.lrange("tips", 0, -1)) || [];
  return NextResponse.json(tips);
}

