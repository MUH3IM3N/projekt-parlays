import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: "GET works" });
}

export async function POST(req: Request) {
  const { pw } = await req.json();
  if (pw === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ ok: false });
  }
}