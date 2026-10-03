import { loadTrainingCatalog } from "@/lib/trainingCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await loadTrainingCatalog();
    if (!catalog.offlinePack) throw new Error("Offline assets unavailable");
    return Response.json({ status: "ok", app: "blueclue", revision: process.env.APP_REVISION ?? "local", catalog: catalog.catalogKind }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", app: "blueclue" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
