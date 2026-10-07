import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadLocalPilot } from "./localPilot";
import { tracks as demoTracks } from "./tracks";
import { longTracks as longSourceTracks } from "./longTracks";
import type { OfflinePack } from "./offlineTypes";
import bassSource from "../../data/listening/bass.json";
import percussionSource from "../../data/listening/percussion.json";
import choiceSource from "../../data/listening/choice.json";
import type { ListeningTrack } from "./listening";

export async function loadTrainingCatalog() {
  const pilot = await loadLocalPilot(process.cwd());
  const sourceTracks = pilot.tracks ?? demoTracks;
  const allSourceTracks = [...sourceTracks, ...longSourceTracks, bassSource as ListeningTrack, percussionSource as ListeningTrack, choiceSource as ListeningTrack];
  const files = await Promise.all(allSourceTracks.map(async track => {
    const info = await stat(path.join(process.cwd(), "public", track.audioFile));
    return { size: info.size, modified: info.mtimeMs };
  }));
  const revision = createHash("sha256").update(JSON.stringify([allSourceTracks, files])).digest("hex").slice(0, 24);
  const allTracks = allSourceTracks.map(track => ({ ...track, audioFile: `${track.audioFile}?v=${revision}` }));
  const tracks = allTracks.slice(0, sourceTracks.length);
  const longTracks = allTracks.slice(sourceTracks.length, sourceTracks.length + longSourceTracks.length);
  const listeningTrack: ListeningTrack = { ...bassSource as ListeningTrack, audioFile: allTracks.at(-3)!.audioFile };
  const percussionTrack: ListeningTrack = { ...percussionSource as ListeningTrack, audioFile: allTracks.at(-2)!.audioFile };
  const choiceTrack: ListeningTrack = { ...choiceSource as ListeningTrack, audioFile: allTracks.at(-1)!.audioFile };
  let offlinePack: OfflinePack | null = null;
  if (process.env.NODE_ENV === "production") {
    try {
      const manifest = JSON.parse(await readFile(path.join(process.cwd(), "public/offline-assets.json"), "utf8"));
      if (typeof manifest.buildId === "string" && Array.isArray(manifest.assets) && manifest.assets.every((asset: unknown) => typeof asset === "string" && asset.startsWith("/"))) {
        offlinePack = { id: `${manifest.buildId}-${revision}`, assets: manifest.assets, audio: allTracks.map(track => track.audioFile), audioBytes: files.reduce((total, file) => total + file.size, 0) };
      }
    } catch {
      offlinePack = null;
    }
  }
  return { tracks, longTracks, listeningTrack, percussionTrack, choiceTrack, catalogKind: pilot.tracks ? "local" as const : "demo" as const, catalogNotice: pilot.notice, offlinePack };
}
