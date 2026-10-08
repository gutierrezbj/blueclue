// Variantes de las prácticas de escucha. Mismo sintetizador, otros tiempos, otro orden.
// Se generan en .local/variants/ para que Juan las escuche. Publicar solo las aceptadas:
//   node scripts/create-listening-variants.mjs --publish bass-variant-b choice-variant-c
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderListeningArrangement } from "./listening-arrangement.mjs";

const bpm = 96;
const beat = 60 / bpm;
const approved = {
  bass: [7, 12, 17],
  percussion: [6.75, 11.75, 16.125],
  choice: [6.75, 11.75, 16.125, 18.625, 22.375, 25.5]
};

// Tiempos en beats desde el final del acomodo. Cada variante cambia entradas, salidas y orden.
const plans = {
  bass: {
    leadInSeconds: 2, duration: 23, beatCount: 32, bassGain: 0.22,
    base: [{ beats: 0, action: "percussion-in" }],
    variants: {
      b: [{ beats: 6, action: "bass-in" }, { beats: 13, action: "bass-out" }, { beats: 22, action: "bass-in" }],
      c: [{ beats: 10, action: "bass-in" }, { beats: 15, action: "bass-out" }, { beats: 20, action: "bass-in" }, { beats: 27, action: "bass-out" }],
      d: [{ beats: 4, action: "bass-in" }, { beats: 11, action: "bass-out" }, { beats: 18, action: "bass-in" }],
      e: [{ beats: 12, action: "bass-in" }, { beats: 19, action: "bass-out" }, { beats: 25, action: "bass-in" }]
    }
  },
  percussion: {
    leadInSeconds: 3, duration: 24, beatCount: 32, bassInitiallyPresent: true, bassGain: 0.12,
    base: [],
    variants: {
      b: [{ beats: 4, action: "percussion-in" }, { beats: 10, action: "percussion-out" }, { beats: 18, action: "percussion-in" }],
      c: [{ beats: 8, action: "percussion-in" }, { beats: 15, action: "percussion-out" }, { beats: 22, action: "percussion-in" }, { beats: 27, action: "percussion-out" }],
      d: [{ beats: 11, action: "percussion-in" }, { beats: 17, action: "percussion-out" }, { beats: 24, action: "percussion-in" }],
      e: [{ beats: 7, action: "percussion-in" }, { beats: 12, action: "percussion-out" }, { beats: 17, action: "percussion-in" }]
    }
  },
  choice: {
    leadInSeconds: 3, duration: 32, beatCount: 44, bassInitiallyPresent: false, bassGain: 0.22,
    base: [],
    variants: {
      b: [{ beats: 5, action: "percussion-in" }, { beats: 11, action: "bass-in" }, { beats: 17, action: "percussion-out" }, { beats: 22, action: "percussion-in" }, { beats: 27, action: "bass-out" }, { beats: 32, action: "bass-in" }],
      c: [{ beats: 4, action: "bass-in" }, { beats: 9, action: "bass-out" }, { beats: 13, action: "percussion-in" }, { beats: 19, action: "bass-in" }, { beats: 24, action: "percussion-out" }, { beats: 29, action: "percussion-in" }],
      d: [{ beats: 7, action: "percussion-in" }, { beats: 12, action: "percussion-out" }, { beats: 16, action: "bass-in" }, { beats: 23, action: "percussion-in" }, { beats: 29, action: "bass-out" }, { beats: 34, action: "bass-in" }],
      e: [{ beats: 8, action: "bass-in" }, { beats: 13, action: "percussion-in" }, { beats: 18, action: "percussion-out" }, { beats: 23, action: "bass-out" }, { beats: 28, action: "percussion-in" }, { beats: 33, action: "bass-in" }]
    }
  }
};

const titles = { bass: "Escucha el bajo", percussion: "Escucha la percusión", choice: "¿Bajo o batería?" };
const descriptions = {
  bass: "Reconoce cuándo entra y vuelve el bajo. No necesitas contar.",
  percussion: "Reconoce cuándo entra y vuelve la batería mientras la melodía continúa.",
  choice: "Escucha qué instrumento entra y elige bajo o batería."
};

export function buildVariant(instrument, letter) {
  const plan = plans[instrument];
  const changes = [...plan.base, ...plan.variants[letter]].map(change => ({ time: Math.round((plan.leadInSeconds + change.beats * beat) * 1000) / 1000, action: change.action }));
  const entries = changes.filter(change => change.action.endsWith("-in") && !plan.base.includes(change)).map(change => change.time);
  if (entries.some(time => approved[instrument].includes(time))) throw new Error(`La variante ${instrument}-${letter} repite un tiempo de la muestra aprobada`);
  for (let index = 1; index < changes.length; index++) if (changes[index].time - changes[index - 1].time < 2.5) throw new Error(`La variante ${instrument}-${letter} tiene cambios a menos de 2,5 s`);
  if (entries.some(time => time + 2.5 > plan.duration)) throw new Error(`La variante ${instrument}-${letter} no deja 2,5 s para reaccionar`);
  const { wav, metadata } = renderListeningArrangement({ bpm, leadInSeconds: plan.leadInSeconds, duration: plan.duration, beatCount: plan.beatCount, changes, bassInitiallyPresent: plan.bassInitiallyPresent ?? false, bassGain: plan.bassGain });
  const id = `${instrument}-variant-${letter}`;
  const track = {
    id, instrument, title: titles[instrument], bpm, timeSignature: "4/4", difficulty: "easy", description: descriptions[instrument],
    audioFile: `/tracks/listening/variants/${id}.wav`, duration: plan.duration, leadInSeconds: plan.leadInSeconds,
    beats: Array.from({ length: plan.beatCount }, (_, index) => Math.round((plan.leadInSeconds + index * beat) * 1000) / 1000),
    downbeats: Array.from({ length: Math.ceil(plan.beatCount / 4) }, (_, index) => Math.round((plan.leadInSeconds + index * 4 * beat) * 1000) / 1000),
    changes, referenceStatus: "pending-listening"
  };
  return { wav, track, peak: metadata.peak };
}

export function allVariantIds() {
  return Object.entries(plans).flatMap(([instrument, plan]) => Object.keys(plan.variants).map(letter => `${instrument}-variant-${letter}`));
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  const publishIndex = process.argv.indexOf("--publish");
  const toPublish = publishIndex >= 0 ? process.argv.slice(publishIndex + 1) : [];
  await mkdir(".local/variants", { recursive: true });
  const built = new Map();
  for (const id of allVariantIds()) {
    const [instrument, , letter] = id.split("-");
    const variant = buildVariant(instrument, letter);
    built.set(id, variant);
    await writeFile(`.local/variants/${id}.wav`, variant.wav);
    await writeFile(`.local/variants/${id}.json`, `${JSON.stringify(variant.track, null, 2)}\n`);
    console.log(`${id} · ${variant.track.duration} s · entradas ${variant.track.changes.filter(c => c.action.endsWith("-in")).map(c => `${c.action.split("-")[0]}@${c.time}`).join(", ")} · pico ${variant.peak.toFixed(3)}`);
  }
  console.log(`Variantes locales en .local/variants/. Escúchalas; publica solo las aceptadas con --publish <id…>.`);
  if (toPublish.length) {
    await mkdir("public/tracks/listening/variants", { recursive: true });
    let published = [];
    try { published = JSON.parse(await readFile("data/listening/variants.json", "utf8")); } catch { published = []; }
    for (const id of toPublish) {
      const variant = built.get(id);
      if (!variant) throw new Error(`Variante desconocida: ${id}`);
      await writeFile(`public/tracks/listening/variants/${id}.wav`, variant.wav);
      published = [...published.filter(track => track.id !== id), { ...variant.track, referenceStatus: "listening-verified" }];
      console.log(`Publicada ${id} tras la escucha de Juan.`);
    }
    await writeFile("data/listening/variants.json", `${JSON.stringify(published, null, 2)}\n`);
  }
}
