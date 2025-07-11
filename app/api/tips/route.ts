// /pages/api/tips/update.js oder /api/tips/update/route.js

export default async function handler(req, res) {
  if (req.method === "PATCH") {
    const { id, legs, status } = req.body;
    // Hole alle Tipps aus DB/JSON
    // Beispiel: let allTips = await loadTips();
    let allTips = ...;

    // Tipp finden
    const idx = allTips.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    // Update Legs (wenn mitgesendet)
    if (legs) {
      allTips[idx].legs = legs;
    }

    // Update Status (wenn mitgesendet)
    if (status) {
      allTips[idx].status = status;
    }

    // Save again...
    // await saveTips(allTips);

    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
