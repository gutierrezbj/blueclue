import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("switching counting length remounts the exercise without mixing rounds or saved settings", async () => {
  const app = await readFile(new URL("../src/components/TrainingApp.tsx", import.meta.url), "utf8");
  assert.match(app, /<BarCountingTrainer key=\{bars\} bars=\{bars\}/);
  assert.match(app, /#compases-16/);
  const trainer = await readFile(new URL("../src/components/BarCountingTrainer.tsx", import.meta.url), "utf8");
  assert.match(trainer, /className="phrase-steps" aria-label="Pasos de conteo"/);
  assert.match(trainer, /Cuando estés cómodo · Cuenta 16 compases/);
  assert.match(trainer, /getVisibleBars\(guide.bar\)/);
  assert.match(app, /#compases-32/);
  assert.match(app, /tracks=\{bars === 32 \? props.longTracks : props.tracks\}/);
  assert.match(trainer, /Cuando estés cómodo · Cuenta 32 compases/);
});
