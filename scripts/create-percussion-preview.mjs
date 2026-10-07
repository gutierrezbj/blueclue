import { mkdir, writeFile } from "node:fs/promises";
import { renderPercussionPreview } from "./percussion-preview.mjs";

const { wav, metadata } = renderPercussionPreview();
await mkdir(".local", { recursive: true });
await writeFile(".local/escucha-la-percusion.wav", wav);
await writeFile(".local/escucha-la-percusion.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Muestra local: ${metadata.duration} segundos, ${wav.length} bytes, pico ${metadata.peak.toFixed(3)}. Pendiente de escucha humana; no publicada ni integrada en el catálogo.`);
