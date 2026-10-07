import assert from "node:assert/strict";
import test from "node:test";
import { renderChangeChoicePreview } from "../scripts/change-choice-preview.mjs";

const { wav, metadata } = renderChangeChoicePreview();
const sampleAt = index => wav.readInt16LE(44 + index * 2) / 32767;

function energy(start, derivative = false) {
  const first = Math.round(start * metadata.sampleRate);
  const count = Math.round(0.12 * metadata.sampleRate);
  let total = 0;
  for (let index = first + 1; index < first + count; index++) {
    const value = derivative ? sampleAt(index) - sampleAt(index - 1) : sampleAt(index);
    total += value ** 2;
  }
  return total / count;
}

test("choice preview is deterministic PCM with preparation and no clipping", () => {
  assert.equal(metadata.duration, 32);
  assert.equal(metadata.bpm, 96);
  assert.equal(wav.length, 44 + 32 * 22050 * 2);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 22050);
  assert.deepEqual(renderChangeChoicePreview().wav, wav);
  for (let index = 0; index < 3 * 22050; index++) assert.equal(sampleAt(index), 0);
  for (let index = 0; index < 32 * 22050; index++) assert.ok(Math.abs(sampleAt(index)) < 0.95);
});

test("four separate entrances identify both instruments, never simultaneous changes", () => {
  const entries = metadata.changes.filter(change => change.action.endsWith("-in"));
  assert.deepEqual(entries.map(change => change.action), ["bass-in", "percussion-in", "bass-in", "percussion-in"]);
  assert.deepEqual(entries.map(change => change.time), [6.75, 11.75, 18.625, 25.5]);
  assert.equal(new Set(metadata.changes.map(change => change.time)).size, metadata.changes.length);
  for (let index = 1; index < entries.length; index++) assert.ok(entries[index].time - entries[index - 1].time >= 3);
  assert.ok(metadata.duration - entries.at(-1).time >= 3);
});

test("bass adds sustained energy and drums add transients over the same melodic pattern", () => {
  assert.ok(energy(6.95) > energy(4.45) * 2);
  assert.ok(energy(11.75, true) > energy(9.25, true) * 10);
  assert.ok(energy(18.825) > energy(16.325) * 2);
  assert.ok(energy(25.5, true) > energy(23, true) * 10);
  assert.ok(energy(3.25) > 0);
});
