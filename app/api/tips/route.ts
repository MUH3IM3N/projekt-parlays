import { NextRequest, NextResponse } from "next/server";
// Passe das ggf. auf deinen Speicherpfad an!
import { promises as fs } from "fs";
const DB_PATH = process.cwd() + "/data/tips.json"; // ggf. anpassen!

async function loadTips() {
  const txt = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(txt);
}

async function saveTips(tips: any[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(tips, null, 2), "utf8");
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, legs, status } = body;

  let allTips = await loadTips();
  const idx = allTips.findIndex((t: any) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update legs/status
  if (legs) allTips[idx].legs = legs;
  if (typeof status !== "undefined") allTips[idx].status = status;

  await saveTips(allTips);
  return NextResponse.json({ ok: true });
}
