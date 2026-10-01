import assert from "node:assert/strict";
import test from "node:test";
import { preparePlayback } from "./playbackPreparation.ts";

test("practice waits four full seconds before starting audio", (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  const ticks: (number | null)[] = [];
  let starts = 0;
  preparePlayback((seconds) => ticks.push(seconds), () => { starts += 1; });
  assert.deepEqual(ticks, [4]);
  context.mock.timers.tick(999);
  assert.equal(starts, 0);
  context.mock.timers.tick(1);
  assert.deepEqual(ticks, [4, 3]);
  context.mock.timers.tick(2999);
  assert.equal(starts, 0);
  context.mock.timers.tick(1);
  assert.deepEqual(ticks, [4, 3, 2, 1, null]);
  assert.equal(starts, 1);
  context.mock.timers.tick(5000);
  assert.equal(starts, 1);
});

test("cancelling preparation prevents delayed playback after navigation", (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  let starts = 0;
  const cancel = preparePlayback(() => undefined, () => { starts += 1; });
  context.mock.timers.tick(1000);
  cancel();
  context.mock.timers.tick(5000);
  assert.equal(starts, 0);
});
