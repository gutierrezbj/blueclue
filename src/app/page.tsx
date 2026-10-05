import { TrainingApp } from "@/components/TrainingApp";
import { loadTrainingCatalog } from "@/lib/trainingCatalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await loadTrainingCatalog();
  return <><meta name="blueclue-pack" content={catalog.offlinePack?.id ?? "development"} /><TrainingApp {...catalog} /></>;
}
