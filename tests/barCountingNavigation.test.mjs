import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("switching counting length remounts the exercise without mixing rounds or saved settings", async () => {
  const app = await readFile(new URL("../src/components/TrainingApp.tsx", import.meta.url), "utf8");
  assert.match(app, /<BarCountingTrainer key=\{bars\} bars=\{bars\}/);
  const routes = await readFile(new URL("../src/lib/navigation.ts", import.meta.url), "utf8");
  assert.match(routes, /#compases-16/);
  const trainer = await readFile(new URL("../src/components/BarCountingTrainer.tsx", import.meta.url), "utf8");
  assert.match(trainer, /className="phrase-steps" aria-label="Pasos de conteo"/);
  assert.match(trainer, /getVisibleBars\(guide.bar\)/);
  assert.match(routes, /#compases-32/);
  assert.match(app, /tracks=\{bars === 32 \? props.longTracks : props.tracks\}/);
});

test("long counts are not recommended steps and existing links remain optional", async () => {
  const trainer = await readFile(new URL("../src/components/BeatTrainer.tsx", import.meta.url), "utf8");
  const counting = await readFile(new URL("../src/components/BarCountingTrainer.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(trainer, /href="#compases/);
  assert.doesNotMatch(counting, /Cuando estés cómodo|Siguiente etapa/);
  assert.match(counting, /Conteo opcional · Fuera del recorrido/);
  assert.match(counting, /Volver al Beat Trainer/);
});
