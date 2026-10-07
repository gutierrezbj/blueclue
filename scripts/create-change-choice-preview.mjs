import { mkdir, writeFile } from "node:fs/promises";
import { renderChangeChoicePreview } from "./change-choice-preview.mjs";

const { wav, metadata } = renderChangeChoicePreview();
await mkdir(".local", { recursive: true });
await writeFile(".local/bajo-o-bateria.wav", wav);
await writeFile(".local/bajo-o-bateria.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Muestra local: ${metadata.duration} segundos, ${wav.length} bytes, pico ${metadata.peak.toFixed(3)}. Audio aprobado por Juan; este comando no despliega la web.`);
if (process.argv.includes("--publish")) {
  await mkdir("public/tracks/listening", { recursive: true });
  await mkdir("data/listening", { recursive: true });
  await writeFile("public/tracks/listening/choice.wav", wav);
  await writeFile("data/listening/choice.json", `${JSON.stringify({
    id: "choice-listening-v1", instrument: "choice", title: "¿Bajo o batería?",
    bpm: metadata.bpm, timeSignature: "4/4", difficulty: "easy",
    description: "Escucha qué instrumento entra y elige bajo o batería.",
    audioFile: "/tracks/listening/choice.wav", duration: metadata.duration, leadInSeconds: metadata.leadInSeconds,
    beats: Array.from({ length: 44 }, (_, index) => metadata.leadInSeconds + index * 60 / metadata.bpm),
    downbeats: Array.from({ length: 11 }, (_, index) => metadata.leadInSeconds + index * 4 * 60 / metadata.bpm),
    changes: metadata.changes
  }, null, 2)}\n`);
  console.log("Copiada la misma muestra aprobada al catálogo público de escucha.");
}
