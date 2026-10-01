import assert from "node:assert/strict";
import test from "node:test";
import { getBeatPosition, isDownbeat } from "./beatGrid.ts";

test("a pickup does not become a false downbeat", () => {
  const beats = [0.2, 0.7, 1.2, 1.7, 2.2, 2.7, 3.2];
  const downbeats = [1.2, 3.2];
  assert.equal(getBeatPosition(0.2, beats, downbeats).count, 3);
  assert.equal(getBeatPosition(0.7, beats, downbeats).count, 4);
  assert.equal(getBeatPosition(1.2, beats, downbeats).count, 1);
  assert.equal(getBeatPosition(3.2, beats, downbeats).bar, 2);
  assert.equal(isDownbeat(beats[0], downbeats), false);
  assert.equal(isDownbeat(beats[2], downbeats), true);
});

test("counter and downbeat markers share the same reference", () => {
  const beats = [0.65, 1.15, 1.65, 2.15, 2.65];
  const downbeats = [0.65, 2.65];
  for (const beat of beats) assert.equal(getBeatPosition(beat, beats, downbeats).count === 1, isDownbeat(beat, downbeats));
  assert.equal(getBeatPosition(0, beats, downbeats).count, null);
  assert.equal(getBeatPosition(1, [], []).count, null);
  assert.equal(getBeatPosition(NaN, beats, downbeats).count, null);
});
