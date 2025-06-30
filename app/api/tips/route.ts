import { NextResponse } from "next/server";
import customTips from "./custom-tips.json";

export async function GET() {
  // Immer eigene Tipps ausgeben:
  return NextResponse.json(customTips);
}
