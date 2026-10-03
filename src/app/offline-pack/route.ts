import { loadTrainingCatalog } from "@/lib/trainingCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const { offlinePack } = await loadTrainingCatalog();
  return Response.json(offlinePack, { status: offlinePack ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
