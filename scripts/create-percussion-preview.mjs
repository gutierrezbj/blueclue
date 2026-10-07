import { mkdir, writeFile } from "node:fs/promises";
import { renderPercussionPreview } from "./percussion-preview.mjs";

const { wav, metadata } = renderPercussionPreview();
await mkdir(".local", { recursive: true });
await writeFile(".local/escucha-la-percusion.wav", wav);
await writeFile(".local/escucha-la-percusion.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Muestra local: ${metadata.duration} segundos, ${wav.length} bytes, pico ${metadata.peak.toFixed(3)}. Audio aprobado por Juan; este comando no despliega la web.`);
if (process.argv.includes("--publish")) {
  await mkdir("public/tracks/listening", { recursive: true });
  await mkdir("data/listening", { recursive: true });
  await writeFile("public/tracks/listening/percussion.wav", wav);
  await writeFile("data/listening/percussion.json", `${JSON.stringify({
    id: "percussion-listening-v1", instrument: "percussion", title: "Escucha la percusión",
    bpm: metadata.bpm, timeSignature: "4/4", difficulty: "easy",
    description: "Reconoce cuándo entra y vuelve la batería. No necesitas contar.",
    audioFile: "/tracks/listening/percussion.wav", duration: metadata.duration, leadInSeconds: metadata.leadInSeconds,
    beats: Array.from({ length: 32 }, (_, index) => metadata.leadInSeconds + index * 60 / metadata.bpm),
    downbeats: Array.from({ length: 8 }, (_, index) => metadata.leadInSeconds + index * 4 * 60 / metadata.bpm),
    changes: metadata.changes
  }, null, 2)}\n`);
  console.log("Copiada la misma muestra aprobada al catálogo público de escucha.");
}
