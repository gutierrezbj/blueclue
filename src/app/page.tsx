import { BeatTrainer } from "@/components/BeatTrainer";
import { loadLocalPilot } from "@/lib/localPilot";
import { tracks as demoTracks } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pilot = await loadLocalPilot(process.cwd());
  return <BeatTrainer tracks={pilot.tracks ?? demoTracks} catalogKind={pilot.tracks ? "local" : "demo"} catalogNotice={pilot.notice} />;
}
