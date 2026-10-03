import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadLocalPilot } from "./localPilot";
import { tracks as demoTracks } from "./tracks";
import type { OfflinePack } from "./offlineTypes";

export async function loadTrainingCatalog() {
  const pilot = await loadLocalPilot(process.cwd());
  const sourceTracks = pilot.tracks ?? demoTracks;
  const files = await Promise.all(sourceTracks.map(async track => {
    const info = await stat(path.join(process.cwd(), "public", track.audioFile));
    return { size: info.size, modified: info.mtimeMs };
  }));
  const revision = createHash("sha256").update(JSON.stringify([sourceTracks, files])).digest("hex").slice(0, 24);
  const tracks = sourceTracks.map(track => ({ ...track, audioFile: `${track.audioFile}?v=${revision}` }));
  let offlinePack: OfflinePack | null = null;
  if (process.env.NODE_ENV === "production") {
    try {
      const manifest = JSON.parse(await readFile(path.join(process.cwd(), "public/offline-assets.json"), "utf8"));
      if (typeof manifest.buildId === "string" && Array.isArray(manifest.assets) && manifest.assets.every((asset: unknown) => typeof asset === "string" && asset.startsWith("/"))) {
        offlinePack = { id: `${manifest.buildId}-${revision}`, assets: manifest.assets, audio: tracks.map(track => track.audioFile), audioBytes: files.reduce((total, file) => total + file.size, 0) };
      }
    } catch {
      offlinePack = null;
    }
  }
  return { tracks, catalogKind: pilot.tracks ? "local" as const : "demo" as const, catalogNotice: pilot.notice, offlinePack };
}
