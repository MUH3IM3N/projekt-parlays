import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Erlaubt NUR POST-Requests
export async function POST(req: Request) {
  const data = await req.json();
  // Tipp an Liste anhängen
  await kv.rpush("tips", data);
  return NextResponse.json({ success: true });
}
