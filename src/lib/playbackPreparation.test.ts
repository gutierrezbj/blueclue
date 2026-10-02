import assert from "node:assert/strict";
import test from "node:test";
import { getPreparationSeconds } from "./playbackPreparation.ts";

test("preparation follows the moving audio playhead through three seconds of silence", () => {
  assert.equal(getPreparationSeconds(0, 3), 3);
  assert.equal(getPreparationSeconds(0.999, 3), 3);
  assert.equal(getPreparationSeconds(1, 3), 2);
  assert.equal(getPreparationSeconds(2, 3), 1);
  assert.equal(getPreparationSeconds(3, 3), null);
  assert.equal(getPreparationSeconds(10, 3), null);
});

test("pause holds preparation and restart restores it without a delayed-play timer", () => {
  assert.equal(getPreparationSeconds(1.5, 3), 2);
  assert.equal(getPreparationSeconds(1.5, 3), 2);
  assert.equal(getPreparationSeconds(0, 3), 3);
  assert.equal(getPreparationSeconds(0), null);
  assert.equal(getPreparationSeconds(NaN, 3), null);
  assert.equal(getPreparationSeconds(0, Infinity), null);
});
