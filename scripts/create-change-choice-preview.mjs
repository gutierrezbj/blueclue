import { mkdir, writeFile } from "node:fs/promises";
import { renderChangeChoicePreview } from "./change-choice-preview.mjs";

const { wav, metadata } = renderChangeChoicePreview();
await mkdir(".local", { recursive: true });
await writeFile(".local/bajo-o-bateria.wav", wav);
await writeFile(".local/bajo-o-bateria.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Muestra local: ${metadata.duration} segundos, ${wav.length} bytes, pico ${metadata.peak.toFixed(3)}. Pendiente de aceptación auditiva. Sin publicar ni añadir al catálogo.`);
